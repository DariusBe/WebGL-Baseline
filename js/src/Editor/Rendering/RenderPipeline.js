import { Renderer } from "./Renderer.js";

/**
 * RenderPipeline manages a sequence of rendering passes to produce the final image.
 * It allows adding multiple render passes and executes them in order.
 */
export class RenderPipeline {
  /**
   * @param {Renderer} renderer - The renderer instance to use for rendering passes.
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.passes = [];
  }

  /**
   * Adds a render pass to the pipeline.
   * @param {RenderPass} renderPass - The render pass to add.
   */
  addPass(renderPass) {
    this.passes.push(renderPass);
  }

  /**
   * Executes all render passes in the pipeline.
   * @param {Scene} scene - The scene to render.
   * @param {Camera} camera - The camera to use for rendering.
   * @param {Object} viewport - The viewport dimensions.
   */
  execute(scene, camera, viewport) {
    for (const pass of this.passes) {
      this.renderer.executePass(pass, scene, camera, viewport);
    }
    this.renderer.combinePasses(this.passes, viewport);
  }
}
