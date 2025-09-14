import { GLContext } from "../../GL/GLContext.js";
import { Scene } from "../../Scene/Scene.js";
import { SceneObject } from "../../Scene/SceneObject.js";
import { Camera } from "../../Scene/Camera.js";
// import { Viewport } from "../../Viewport.js";
import { Texture } from "../../Shading/Texture.js";
import "../../../../gl-matrix-min.js";
import { Uniform } from "../../GL/Uniform.js";
import { Geometry } from "../../Geom/Geometry.js";
import { Attribute } from "../../GL/Attribute.js";
import { RenderTarget } from "../../GL/RenderTarget.js";
import { UUID } from "../../Utils/UUID.js";
import { Utils } from "../../Utils/Utils.js";
import { Material } from "../../Shading/Material.js";
import { ShaderProgram } from "../../GL/ShaderProgram.js";
import { Lamp } from "../../Scene/Lamp.js";
import { Grid } from "../../Scene/SceneExtras.js";
import { Bezier } from "../../Scene/SceneExtras.js";
import { RenderMode } from "./RenderPass.js";

const screenPlane = await SceneObject.createFromOBJ(
  "resources/models/plane.obj",
  "resources/models/plane.mtl"
);
const screenVS = await Utils.readShaderFile(
  "js/src/Shading/canvasShader/canvas.vert"
);
const screenFS = await Utils.readShaderFile(
  "js/src/Shading/canvasShader/canvas.frag"
);
screenPlane.addMaterial(
  new Material(
    "ScreenPlaneMaterial",
    new ShaderProgram(screenVS, screenFS, "ScreenPlaneShader"),
    [
      new Uniform("uSampler0", "1i", 0),
      new Uniform("uSampler1", "1i", 1),
      new Uniform("uSampler2", "1i", 2),
    ]
  ),
  true
);
screenPlane.activeMaterial = screenPlane.solidMaterial;

export class Renderer {
  constructor() {
    /** @type {WebGLRenderingContext} */
    this.gl = GLContext.getInstance().gl;
    this.canvas = this.gl.canvas;
    // set camera viewport
    // this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.primitiveType = "TRIANGLES";
    this.primitiveCount = null;
    this.instanced = false;
    this.clearColor = [0.25, 0.25, 0.25, 1.0];
    this.clear = ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT"];
    this.depthTest = true;
    this.cullFace = true;
    this.stencilTest = false;
    this.blending = true;

    this.screenVAO = null;

    // enable face culling
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
    // enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    // enable blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    // set blending equation
    // this.gl.blendEquation(this.gl.FUNC_ADD);
    this.gl.blendEquation(this.gl.FUNC_ADD);
    // this.gl.clearColor(...this.clearColor);

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.standardView = {
      x0: 0,
      y0: 0,
      xMax: this.canvas.width,
      yMax: this.canvas.height,
    };
  }

  render(
    scene,
    camera,
    target = null,
    mode = RenderMode.SOLID,
    view = this.standardView
  ) {
    const gl = this.gl;

    const { x0, y0, xMax, yMax } = view;
    gl.viewport(x0, y0, xMax, yMax);
    // Bind target and set viewport
    if (target instanceof RenderTarget) {
      target.bind();
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    // Set up state based on mode
    this.depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
    this.cullFace ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
    this.stencilTest ? gl.enable(gl.STENCIL_TEST) : gl.disable(gl.STENCIL_TEST);

    // --- Mode-specific state ---
    switch (mode) {
      case RenderMode.SOLID:
      case RenderMode.WIREFRAME:
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
        gl.enable(gl.DEPTH_TEST);
        break;
      case RenderMode.POINT:
        // Point mode means we render point primitive
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        break;
      case RenderMode.GIZMOS:
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        break;
      default:
        gl.disable(gl.BLEND);
        break;
    }

    gl.clearColor(...this.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // For solid/wireframe, disable blending after clear (for opaque geometry)
    if (mode === RenderMode.SOLID || mode === RenderMode.WIREFRAME) {
      gl.disable(gl.BLEND);
    }

    // Only render relevant objects for each mode
    switch (mode) {
      case RenderMode.GIZMOS:
        // console.error("Rendering", Object.entries(scene.getHierarchyList()));
        for (const [objName, obj] of scene.getHierarchyList()) {
          // console.error("Rendering gizmo:", obj.name, obj);
          if (
            obj.constructor.name === "Gizmo" ||
            obj.constructor.name === "Lamp" ||
            obj.constructor.name === "Grid"
          ) {
            this._renderNode(obj, camera, glMatrix.mat4.create(), mode);
          }
        }
        break;
      default:
        this._renderNode(scene.root, camera, glMatrix.mat4.create(), mode);
        break;
    }

    // for MSAA, copy over MSAA renderTarget data into normal texture
    if (target instanceof RenderTarget && target.multisample) {
      target.msaaFBOCopyOver();
    }

    // if a target is provided, unbind it
    if (target instanceof RenderTarget) {
      target.unbind();
      gl.viewport(x0, y0, xMax, yMax);
    }
    // unbind any resources
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindVertexArray(null);
  }

  _renderNode(object, camera, parentTransform, mode = RenderMode.SOLID) {
    const gl = this.gl;
    const transform = glMatrix.mat4.multiply(
      glMatrix.mat4.create(),
      parentTransform,
      object.transform.getMatrix()
    );

    if (object.name !== "(root)") {
      if (!(object instanceof SceneObject)) return;

      // --- Skip SceneExtras in solid/wireframe passes ---
      if (
        (mode === RenderMode.SOLID || mode === RenderMode.WIREFRAME) &&
        (object.constructor.name === "Gizmo" ||
          object.constructor.name === "Lamp" ||
          object.constructor.name === "Grid")
      ) {
        // Do not render SceneExtras in solid/wireframe passes
        return;
      }

      object.updateTransformUniforms();

      // Set the view and projection matrices
      const glContext = GLContext.getInstance();
      glContext.updateGlobalUniform("uView", camera.getViewMatrix());
      glContext.updateGlobalUniform(
        "uProjection",
        camera.getProjectionMatrix()
      );

      // --- Use a local variable for the material ---
      let material;
      if (
        mode === RenderMode.WIREFRAME &&
        object.constructor.name !== "Grid" &&
        object.constructor.name !== "Lamp"
      ) {
        if (!object.wireframeMaterial) object.createWireframeShader();
        material = object.wireframeMaterial;
      } else if (mode === RenderMode.POINT && object.pointMaterial) {
        material = object.pointMaterial;
      } else {
        material = object.solidMaterial || object.activeMaterial;
      }

      // Set the model matrix uniform in the shader
      if (material && material.shaderProgram) {
        const shader = material.shaderProgram;
        shader.use();

        if (material.texture !== null && material.texture instanceof Texture) {
          material.texture.bindTexture(0);
        } else {
          gl.bindTexture(gl.TEXTURE_2D, null);
        }
        material.setUniform(new Uniform("uModel", "mat4", transform));
      }

      if (object.geometry && material) {
        let vao = object.geometry.geomVAO;
        vao.bind();

        switch (object.constructor.name) {
          case "Grid":
            gl.drawArrays(gl.LINES, 0, object.geometry.primitiveCount);
            break;

          case "Lamp":
            gl.drawArrays(gl.LINES, 0, object.geometry.primitiveCount);
            break;

          case "Bezier":
            gl.drawArraysInstanced(
              gl.POINTS,
              0,
              object.geometry.lineVertices.length,
              object.resolution
            );
            break;

          case "SceneObject":
            if (mode === RenderMode.POINT) {
              // gl.drawArrays(
              //   gl[this.primitiveType],
              //   0,
              //   this.primitiveCount || object.geometry.faces.length * 3
              // );
              gl.drawArrays(
                gl["points"],
                0,
                this.primitiveCount || object.geometry.faces.length * 3
              );
              break;
            } else {
              gl.drawArrays(
                gl[this.primitiveType],
                0,
                this.primitiveCount || object.geometry.faces.length * 3
              );
              break;
            }
        }

        // if (object instanceof Lamp || object instanceof Grid) {
        //   gl.drawArrays(gl.LINES, 0, object.geometry.primitiveCount);
        // } else if (object instanceof Bezier) {
        //   gl.drawArraysInstanced(
        //     gl.POINTS,
        //     0,
        //     object.geometry.lineVertices.length,
        //     object.resolution
        //   );
        // } else {
        //   gl.drawArrays(
        //     gl[this.primitiveType],
        //     0,
        //     this.primitiveCount || object.geometry.faces.length * 3
        //   );
        // }
      }

      // Unbind all resources
      gl.bindVertexArray(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(null);
    }
    // Recurse into children
    for (const [_, child] of object.children || []) {
      // console.error("current", child.name, child.transform);
      if (child) this._renderNode(child, camera, transform, mode);
    }
  }

  renderScreenQuad(textures, view = null, verbose = false) {
    const gl = this.gl;

    gl.disable(gl.BLEND);

    if (!this.screenVAO) {
      this.screenVAO = screenPlane.geometry.geomVAO;
    }
    const shaderProgram = screenPlane.activeMaterial.shaderProgram;
    if (!shaderProgram) {
      console.error("No shader program found for screen quad rendering.");
      return;
    }
    shaderProgram.use();

    // Bind textures to units
    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];
      // console.warn(texture.name);
      if (texture instanceof Texture) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture.webGLTexture);
      } else {
        console.warn(`Texture at index ${i} is not a valid Texture instance.`);
      }
    }

    // --- Set sampler uniforms explicitly ---
    const program = shaderProgram.program; // WebGLProgram
    const loc0 = gl.getUniformLocation(program, "uSampler0");
    const loc1 = gl.getUniformLocation(program, "uSampler1");
    const loc2 = gl.getUniformLocation(program, "uSampler2");
    const loc3 = gl.getUniformLocation(program, "uSampler3");
    if (loc0 !== null && verbose) {
      gl.uniform1i(loc0, 0);
    } else if (verbose) {
      console.warn("uSampler0 uniform not found in canvas shader.");
    }
    if (loc1 !== null) {
      gl.uniform1i(loc1, 1);
    } else if (verbose) {
      console.warn("uSampler1 uniform not found in canvas shader.");
    }
    if (loc2 !== null) {
      gl.uniform1i(loc2, 2);
    } else if (verbose) {
      console.warn("uSampler2 uniform not found in canvas shader.");
    }
    if (loc3 !== null) {
      gl.uniform1i(loc3, 3);
    } else if (verbose) {
      console.warn("uSampler3 uniform not found in canvas shader.");
    }

    this.screenVAO.bind();
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);

    gl.enable(gl.BLEND);
  }

  equals = (other) => {
    return other instanceof Renderer && this.getUUID() === other.getUUID();
  };
}
