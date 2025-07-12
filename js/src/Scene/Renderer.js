import { GLContext } from "../GL/GLContext.js";
import { Scene } from "./Scene.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";
// import { Viewport } from "../../Viewport.js";
import { Texture } from "../Shading/Texture.js";
import "../../../gl-matrix-min.js";
import { Uniform } from "../GL/Uniform.js";
import { RenderTarget } from "../GL/RenderTarget.js";
import { UUID } from "../Utils/UUID.js";

export class Renderer {
  constructor() {
    this.gl = GLContext.getInstance().gl;
    // set camera viewport
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.clearColor = [0.0, 0.0, 0.0, 1.0];
    this.primitiveType = "TRIANGLES";
    this.primitiveCount = null;
    this.instanced = false;
    this.clearColor = [0.0, 0.0, 0.0, 1.0];
    this.clear = ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT"];
    this.depthTest = true;
    this.cullFace = true;
    this.stencilTest = false;

    // enable face culling
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
    // enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  render(scene, camera, target = null, receiver = null) {
    const gl = this.gl;
    // clear the canvas
    // if a target is provided, bind it
    if (target instanceof RenderTarget) {
      target.bind();
    }
    this.gl.clearColor(...this.clearColor);
    for (const clear of this.clear) {
      this.gl.clear(this.gl[clear]);
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

    this._renderNode(scene.root, camera, glMatrix.mat4.create());
    // if a target is provided, unbind it
    if (target instanceof RenderTarget) {
      target.unbind();
    }
    // unbind any resources
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindVertexArray(null);

    // if a receiver is provided, call its render method
    if (receiver && receiver instanceof SceneObject) {
      this._renderNode(receiver, camera, glMatrix.mat4.create());
    }
  }

  _renderNode(object, camera, parentTransform) {
    if (!(object instanceof SceneObject)) return;
    object.updateTransformUniforms();

    //glMatrix.mat4.create();
    const transform = glMatrix.mat4.multiply(
      glMatrix.mat4.create(),
      parentTransform,
      object.transform.getMatrix()
    );

    // Set the model matrix uniform in the shader
    if (object.activeMaterial && object.activeMaterial.shaderProgram) {
      const shader = object.activeMaterial.shaderProgram;
      shader.use();

      if (
        object.activeMaterial.texture &&
        object.activeMaterial.texture instanceof Texture
      ) {
        object.activeMaterial.texture.bindTexture(0);
      } else {
        // make sure no texture is bound
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      }

      object.activeMaterial.setUniform(
        new Uniform("uModel", "mat4", transform)
      );
    }
    // Set the view and projection matrices
    const glContext = GLContext.getInstance();
    glContext.updateGlobalUniform("uView", camera.getViewMatrix());
    glContext.updateGlobalUniform("uProjection", camera.getProjectionMatrix());

    if (object.geometry && object.activeMaterial) {
      const shader = object.activeMaterial.shaderProgram;
      shader.use();

      // Apply material (uniforms, textures)
      // object.activeMaterial.setUniforms(

      // Get VAO
      const vao = object.geometry.geomVAO;
      vao.bind();

      // // Draw
      // if (object.geometry.geomVAO.indexBuffer.length > 0) {
      //   console.error("HERE");
      //   this.gl.drawElements(
      //     this.gl.TRIANGLES,
      //     object.geometry.indexCount,
      //     this.gl.UNSIGNED_SHORT,
      //     0
      //   );
      // } else {
      this.gl.drawArrays(
        this.gl[this.primitiveType],
        0,
        // if this.primitiveCount is set, use it
        this.primitiveCount || object.geometry.faces.length * 3
      );
      //   }
    }

    // Recurse into children
    for (const child of object.children || []) {
      this._renderNode(child, camera, transform);
    }
  }

  equals = (other) => {
    return other instanceof Renderer && this.getUUID() === other.getUUID();
  };
}
