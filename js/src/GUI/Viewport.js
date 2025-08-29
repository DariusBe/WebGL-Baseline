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

    this.solidPass = null;
    this.wireframePass = null;
    this.gizmoPass = null;

    this.passes = new Map();

    this.createSolidPass();
    this.createWireframePass();
    this.createGizmoPass();

    this.viewportArea = {
      x0: 0,
      y0: 0,
      xMax: width,
      yMax: height,
    };
  }

  createSolidPass() {
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
    this.passes.set("solid", this.solidPass);
  }

  createWireframePass() {
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
    this.passes.set("wireframe", this.wireframePass);
  }

  createGizmoPass() {
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
    this.passes.set("gizmo", this.gizmoPass);
  }

  resize(width, height, offset_x, offset_y) {
    this.width = width;
    this.height = height;
    this.renderTarget = new RenderTarget(width, height);
    this.viewportArea = {
      x0: offset_x,
      y0: offset_y,
      xMax: width,
      yMax: height,
    };
    /* re-create passes */
    this.createSolidPass();
    this.createWireframePass();
    this.createGizmoPass();
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
  drawDebuggingOutlines() {
    // Remove existing outlines
    const existingOutlines = document.querySelectorAll(
      ".viewport-dragging-overlay"
    );
    const topbar = document.getElementsByClassName("topbar");
    const topbar_height = topbar[0] ? topbar[0].offsetHeight : 0;
    existingOutlines.forEach((outline) => outline.remove());

    // Draw a solid fill for the viewport in a div on top of canvas
    const margin = 0;
    const fillDiv = document.createElement("div");
    fillDiv.classList.add("viewport-dragging-overlay");
    fillDiv.style.position = "absolute";
    fillDiv.style.pointerEvents = "none"; // allow clicks to pass through
    // background blur
    fillDiv.style.left = `${this.viewportArea.x0}px`;
    fillDiv.style.top = `${this.viewportArea.y0 + topbar_height}px`;
    fillDiv.style.width = `${this.viewportArea.xMax}px`;
    fillDiv.style.height = `${this.viewportArea.yMax - topbar_height}px`;
    document.body.appendChild(fillDiv);
  }
  removeDebuggingOutlines() {
    const existingOutlines = document.querySelectorAll(
      ".viewport-dragging-overlay"
    );
    existingOutlines.forEach((outline) => outline.remove());
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
