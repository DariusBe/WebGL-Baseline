import { GLContext } from "../GL/GLContext.js";
import { Scene } from "./Scene.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";
import { Viewport } from "../../Viewport.js";
import "../../../gl-matrix-min.js";
import { Uniform } from "../GL/Uniform.js";

export class Renderer {
  constructor() {
    this.gl = GLContext.getInstance().gl;
    // set camera viewport
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    // set the clear color
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // enable face culling
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
    // enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
  }

  render(scene, camera) {
    const gl = this.gl;
    // clear the canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this._renderNode(scene.root, camera, glMatrix.mat4.create());
  }

  _renderNode(object, camera, parentTransform) {
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

      // Draw
      // if (object.geometry.hasIndexBuffer()) {
      //   console.error("HERE");
      //   this.gl.drawElements(
      //     this.gl.TRIANGLES,
      //     object.geometry.indexCount,
      //     this.gl.UNSIGNED_SHORT,
      //     0
      //   );
      // } else {
      this.gl.drawArrays(
        this.gl.TRIANGLES,
        0,
        object.geometry.faces.length * 3
      );
      //   }
    }

    // Recurse into children
    for (const child of object.children || []) {
      this._renderNode(child, camera, transform);
    }
  }
}
