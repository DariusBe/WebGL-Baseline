import { Camera } from "./src/Scene/Camera.js";
import { RenderTarget } from "./src/GL/RenderTarget.js";

export class Viewport {
  constructor(width, height) {
    this.camera = new Camera();
    this.renderTarget = new RenderTarget(width, height);
    this.renderMode = "solid"; // or "wireframe", "x-ray"
    this.showGizmos = false;
  }

  render(scene, renderer) {
    // 1. Render main scene in selected mode
    renderer.render(
      scene,
      this.camera,
      this.renderTarget,
      null,
      this.renderMode
    );

    // 2. Render overlays (gizmos, wireframes) if enabled
    if (this.showGizmos) {
      renderer.renderGizmos(scene, this.camera, this.renderTarget);
    }
  }
}
