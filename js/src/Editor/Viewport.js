import { GLContext } from "../GL/GLContext.js";
import { Camera } from "../Scene/Camera.js";
import { RenderTarget } from "../GL/RenderTarget.js";
import { Renderer } from "../Scene/Renderer.js";
import { Texture } from "../Shading/Texture.js";
import { Sidepanel } from "./Sidepanel.js";

export class Viewport {
  constructor(width, height) {
    this.gl = GLContext.getInstance().gl;
    this.canvas = this.gl.canvas;
    this.width = width;
    this.height = height;
    this.mainCamera = new Camera(
      "mainCamera",
      null,
      null,
      null,
      45,
      0.1,
      1000,
      width,
      height
    );
    this.mainCamera.transform.setTranslation(0, 1, -5); // Default position
    this.mainCamera.fov = 45; // Default field of view
    this.mainCamera.aspect = width / height;
    this.renderTarget = new RenderTarget(width, height);
    this.renderMode = "solid"; // or "wireframe"
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
    this.draggingMask = document.createElement("div");
    this.draggingMask.id = "viewport-dragging-mask";
    this.draggingMask.style.position = "absolute";
    this.draggingMask.style.pointerEvents = "none"; // allow clicks to pass through

    this.sidepanel = new Sidepanel();

    this.prepareListeners();
  }

  prepareListeners() {
    this.sidepanel.buttons["Solid"].onClick = () => {
      this.renderMode = "solid";
    };
    this.sidepanel.buttons["Wireframe"].onClick = () => {
      this.renderMode = "wireframe";
    };
    this.sidepanel.buttons["Shaded"].onClick = () => {
      this.renderMode = "shaded";
    };
    this.sidepanel.buttons["Grid"].onClick = () => {
      // this.scene.toggleGrid();
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

    // adjust sidepanel offset
    this.sidepanel.setOffset(offset_x);

    /* update camera viewport */
    this.mainCamera.aspect = width / height;
    this.mainCamera.updateProjectionMatrix();

    // remove drawViewportDebugMask
    this.removeDebuggingOutlines();
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

  drawViewportDebugMask(color = "rgba(38, 147, 255, 0.26)") {
    const topbar = document.getElementsByClassName("topbar");
    const topbar_height = topbar[0] ? topbar[0].offsetHeight : 0;

    // if fillMask is already appended to canvas, don't append
    if (!this.draggingMask.parentNode) {
      document.body.appendChild(this.draggingMask);
    }
    this.draggingMask.style.position = "absolute";
    this.draggingMask.style.pointerEvents = "none"; // allow clicks to pass through
    this.draggingMask.style.backgroundColor = color;
    // background blur
    this.draggingMask.style.left = `${this.viewportArea.x0}px`;
    this.draggingMask.style.top = `${this.viewportArea.y0 + topbar_height}px`;
    this.draggingMask.style.width = `${this.viewportArea.xMax}px`;
    this.draggingMask.style.height = `${
      this.viewportArea.yMax - topbar_height
    }px`;
  }
  removeDebuggingOutlines() {
    this.draggingMask.remove();
  }

  destroy() {
    this.removeDebuggingOutlines();
    this.sidepanel.destroy();
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
