import { Camera } from "./src/Scene/Camera.js";
import { RenderTarget } from "./RenderTarget.js";

export class Viewport {
  constructor(width, height) {
    this.camera = new Camera();
    this.renderTarget = new RenderTarget(width, height);
    this.renderMode = "solid"; // or wireframe, x-ray, etc.
  }
}
