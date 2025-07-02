import { GLContext } from "./GLContext.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";

export class Scene {
  objects = [];
  lights = [];
  camera = new Camera();

  render(renderer, viewport) {
    renderer.renderScene(this, viewport);
  }
}
