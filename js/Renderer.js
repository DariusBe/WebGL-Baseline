import { GLContext } from "./GLContext.js";
import { Scene } from "./Scene.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";
import { Viewport } from "./Viewport.js";

export class Renderer {
  renderScene(scene, viewport) {
    this.bindRenderTarget(viewport.renderTarget);

    for (let object of scene.objects) {
      this.drawObject(object, scene.camera);
    }
  }

  drawObject(object, camera) {
    let shader = object.material.shader;
    shader.use();
    shader.setUniforms(object, camera);

    gl.bindVertexArray(object.geometry.vao);
    gl.drawArrays(gl.TRIANGLES, 0, object.geometry.vertexCount);
  }
}
