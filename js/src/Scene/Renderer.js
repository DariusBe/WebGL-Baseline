import { GLContext } from "../GL/GLContext.js";
import { Scene } from "./Scene.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";
// import { Viewport } from "../../Viewport.js";
import { Texture } from "../Shading/Texture.js";
import "../../../gl-matrix-min.js";
import { Uniform } from "../GL/Uniform.js";
import { Geometry } from "../Geom/Geometry.js";
import { Attribute } from "../GL/Attribute.js";
import { RenderTarget } from "../GL/RenderTarget.js";
import { UUID } from "../Utils/UUID.js";
import { Utils } from "../Utils/Utils.js";
import { Material } from "../Shading/Material.js";
import { ShaderProgram } from "../GL/ShaderProgram.js";
import { Lamp } from "./Lamp.js";
import { Grid } from "./SceneExtras.js";
import { Bezier } from "./SceneExtras.js";

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
    [new Uniform("uSampler0", "1i", 0), new Uniform("uSampler1", "1i", 1)]
  ),
  true
);
screenPlane.activeMaterial = screenPlane.solidMaterial;

export class Renderer {
  constructor() {
    this.gl = GLContext.getInstance().gl;
    // set camera viewport
    // this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.primitiveType = "TRIANGLES";
    this.primitiveCount = null;
    this.instanced = false;
    this.clearColor = [0.0, 0.0, 0.0, 1.0];
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
    this.gl.blendEquation(this.gl.FUNC_ADD);

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  render(scene, camera, target = null, receiver = null, mode = "solid") {
    const gl = this.gl;

    if (target instanceof RenderTarget) {
      target.bind();
      // Set viewport to FBO size!
      gl.viewport(0, 0, target.width, target.height);
    } else {
      // Set viewport to canvas size for default framebuffer
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    if (this.depthTest) {
      this.gl.enable(this.gl.DEPTH_TEST);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
    if (this.cullFace) {
      this.gl.enable(this.gl.CULL_FACE);
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }
    if (this.stencilTest) {
      this.gl.enable(this.gl.STENCIL_TEST);
    } else {
      this.gl.disable(this.gl.STENCIL_TEST);
    }
    if (this.blending && mode !== "wireframe") {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.blendEquation(this.gl.FUNC_ADD);
    } else {
      this.gl.disable(this.gl.BLEND);
    }

    // Clear the canvas
    // gl.clearColor(...this.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // console.log("Bound framebuffer:", gl.getParameter(gl.FRAMEBUFFER_BINDING));
    this._renderNode(scene.root, camera, glMatrix.mat4.create(), mode);

    // for MSAA, copy over MSAA renderTarget data into normal texture
    if (target instanceof RenderTarget && target.multisample) {
      target.msaaFBOCopyOver();
    }

    // if a target is provided, unbind it
    if (target instanceof RenderTarget) {
      target.unbind();
      // Reset viewport to canvas size when unbinding
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    // unbind any resources
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindVertexArray(null);

    // if a receiver is provided, call its render method
    // if (receiver && receiver instanceof SceneObject) {
    //   this._renderNode(receiver, camera, glMatrix.mat4.create());
    // }
  }

  _renderNode(object, camera, parentTransform, mode = "solid") {
    const gl = this.gl;

    const transform = glMatrix.mat4.multiply(
      glMatrix.mat4.create(),
      parentTransform,
      object.transform.getMatrix()
    );

    if (object.name !== "(root)") {
      if (!(object instanceof SceneObject)) return;
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
      if (mode === "wireframe") {
        if (!object.wireframeMaterial) object.createWireframeShader();
        material = object.wireframeMaterial;
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

        if (object instanceof Lamp || object instanceof Grid) {
          gl.drawArrays(gl.LINES, 0, object.geometry.primitiveCount);
        } else if (object instanceof Bezier) {
          gl.drawArraysInstanced(
            gl.POINTS,
            0,
            object.geometry.lineVertices.length,
            object.resolution
          );
        } else {
          gl.drawArrays(
            gl[this.primitiveType],
            0,
            this.primitiveCount || object.geometry.faces.length * 3
          );
        }
      }

      // Unbind all resources
      gl.bindVertexArray(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(null);
    }
    // Recurse into children
    for (const child of object.children || []) {
      this._renderNode(child, camera, transform, mode);
    }
  }

  renderScreenQuad(textures) {
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
      if (texture instanceof Texture) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture.webGLTexture);
      }
    }

    // --- Set sampler uniforms explicitly ---
    const program = shaderProgram.program; // WebGLProgram
    const loc0 = gl.getUniformLocation(program, "uSampler0");
    const loc1 = gl.getUniformLocation(program, "uSampler1");
    if (loc0 !== null) gl.uniform1i(loc0, 0);
    if (loc1 !== null) gl.uniform1i(loc1, 1);

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
