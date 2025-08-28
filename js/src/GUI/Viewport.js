import { GLContext } from "../GL/GLContext.js";
import { Camera } from "../Scene/Camera.js";
import { RenderTarget } from "../GL/RenderTarget.js";
import { Renderer } from "../Scene/Renderer.js";
import { Texture } from "../Shading/Texture.js";

export class Viewport {
  constructor(width, height) {
    this.gl = GLContext.getInstance().gl;
    this.canvas = this.gl.canvas;
    this.width = width;
    this.height = height;
    this.mainCamera = new Camera("mainCamera");
    this.mainCamera.transform.setTranslation(0, 1, -5); // Default position
    this.mainCamera.fov = 8; // Default field of view
    this.renderTarget = new RenderTarget(width, height);
    this.renderMode = "solid"; // or "wireframe", "x-ray"
    this.showGizmos = true;
    this.passes = {};

    this.solidPass = new RenderTarget(
      this.width,
      this.height,
      "SolidFBO",
      new Texture(
        "SolidFBOTexture",
        null,
        this.width,
        this.height,
        "RGBA16F",
        "LINEAR",
        "RGBA",
        "FLOAT",
        "CLAMP_TO_EDGE"
      ),
      true,
      true
    );

    // Try changing the wireframe render target texture format from RGBA16F to RGBA8
    this.wireframePass = new RenderTarget(
      this.width,
      this.height,
      "WireframeFBO",
      new Texture(
        "WireframeFBOTexture",
        null,
        this.width,
        this.height,
        "RGBA16F", // Changed from RGBA8
        "LINEAR",
        "RGBA",
        "FLOAT", // Changed from UNSIGNED_BYTE
        "CLAMP_TO_EDGE"
      ),
      true,
      true
    );

    this.gizmoPass = new RenderTarget(
      this.width,
      this.height,
      "GizmoFBO",
      new Texture(
        "GizmoFBOTexture",
        null,
        this.width,
        this.height,
        "RGBA16F",
        "LINEAR",
        "RGBA",
        "FLOAT",
        "CLAMP_TO_EDGE"
      ),
      true,
      false
    );

    this.viewportArea = {
      x0: 0,
      y0: 0,
      xMax: width,
      yMax: height,
    };
  }

  render(scene, renderer) {
    // console.log(scene.getHierarchyList());
    renderer.render(
      scene,
      this.mainCamera,
      this.wireframePass,
      this.renderMode,
      this.viewportArea
    );
  }
}
/**
   render(
    scene,
    camera,
    target = null,
    mode = "solid",
    view = this.standardView
  ) {
*/
