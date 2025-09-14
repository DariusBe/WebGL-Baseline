import { GLContext } from "../../GL/GLContext.js";
import { RenderTarget } from "../../GL/RenderTarget.js";
import { Texture } from "../../Shading/Texture.js";

export const RenderMode = {
  SOLID: "solid",
  WIREFRAME: "wireframe",
  POINT: "point",
  GIZMOS: "gizmos",
};

export class RenderPass {
  constructor(mode = RenderMode.SOLID, width, height, withMSAA, withPicking) {
    this.gl = GLContext.getInstance().gl;
    this.mode = mode;
    this.name = `${mode}_RenderPass`;
    this.width = width;
    this.height = height;
    this.withMSAA = withMSAA;
    this.withPicking = withPicking;
    this.target = null; // FBO
    this.texture = null; // Texture
    this.prepare();
  }

  prepare() {
    this.texture = new Texture(
      `${this.mode}_FBOTexture`,
      null,
      this.width,
      this.height,
      "RGBA16F",
      "LINEAR",
      "RGBA",
      "FLOAT",
      "CLAMP_TO_EDGE"
    );

    this.target = new RenderTarget(
      this.width,
      this.height,
      `${this.mode}_FBO`,
      this.texture,
      this.withMSAA,
      this.withPicking
    );
  }
}
