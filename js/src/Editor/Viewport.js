import { GLContext } from "../GL/GLContext.js";
import { Camera } from "../Scene/Camera.js";
import { RenderTarget } from "../GL/RenderTarget.js";
import { Renderer } from "./Rendering/Renderer.js";
import { Texture } from "../Shading/Texture.js";
import { Sidepanel } from "./GUI/Sidepanel.js";
import { Scene } from "../Scene/Scene.js";
import { RenderMode } from "./Rendering/RenderPass.js";
import { RenderPass } from "./Rendering/RenderPass.js";
import { RenderPipeline } from "./Rendering/RenderPipeline.js";

export class Viewport {
  constructor(width, height, scene) {
    this.gl = GLContext.getInstance().gl;
    this.scene = scene;
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
    this.renderMode = RenderMode.SOLID; // or "wireframe"
    this.showGizmos = true;

    (this.solidPass = new RenderPass(
      RenderMode.SOLID,
      width,
      height,
      true,
      true
    )), // main solid pass with MSAA and picking
      (this.vertexPointsPass = new RenderPass(
        RenderMode.POINT,
        width,
        height,
        true,
        true
      )), // display vertex points on top of solid
      (this.wireframePass = new RenderPass(
        RenderMode.WIREFRAME,
        width,
        height,
        true,
        true
      )), // wireframe pass with MSAA and picking
      (this.gizmoPass = new RenderPass(
        RenderMode.GIZMOS,
        width,
        height,
        true,
        true
      )), // gizmo pass with MSAA and picking
      (this.passes = [
        this.solidPass,
        this.wireframePass,
        this.gizmoPass,
        this.vertexPointsPass,
      ]);

    this.viewportArea = {
      x0: 0,
      y0: 0,
      xMax: width,
      yMax: height,
    };
    this.draggingMask = document.createElement("div");
    this.draggingMask.id = "viewport-dragging-mask";
    this.draggingMask.style.position = "absolute";
    // allow clicks to pass through
    this.draggingMask.style.pointerEvents = "none";

    this.sidepanel = new Sidepanel();

    this.prepareListeners();
  }

  pickObjects = (x, y) => {
    // for (const obj of scene.getHierarchyList()) {
    //   console.log("Object picking UUIDs:", obj.name + ":", obj.pickingColor);
    // }
    // solidPass.msaaFBOCopyOver(); // Ensure MSAA data is copied over
    const pickedColor = this.solidPass.readPickingAt(x, y);
    // console.log("Picked color:", pickedColor);

    const threshold = 0.001; // precision threshold for color comparison
    for (const obj of scene.getHierarchyList(true)) {
      if (
        // float-safe color comparison
        Math.abs(obj.pickingColor[0] - pickedColor[0]) < threshold &&
        Math.abs(obj.pickingColor[1] - pickedColor[1]) < threshold &&
        Math.abs(obj.pickingColor[2] - pickedColor[2]) < threshold &&
        Math.abs(obj.pickingColor[3] - pickedColor[3]) < threshold
      ) {
        // If a match is found, toggle selection and update uniforms
        console.log("Picked object:", obj.name);
        obj.toggleSelected();
        obj.updateTransformUniforms();
        return; // Exit after picking the first matching object
      }
    }
  };

  // createSolidPass() {
  //   this.solidPass = new RenderTarget(
  //     this.width,
  //     this.height,
  //     "SolidFBO",
  //     new Texture(
  //       "SolidFBOTexture",
  //       null,
  //       this.width,
  //       this.height,
  //       "RGBA16F",
  //       "LINEAR",
  //       "RGBA",
  //       "FLOAT",
  //       "CLAMP_TO_EDGE"
  //     ),
  //     true,
  //     true
  //   );
  //   this.passes.set("solid", this.solidPass);
  // }

  // createWireframePass() {
  //   // Try changing the wireframe render target texture format from RGBA16F to RGBA8
  //   this.wireframePass = new RenderTarget(
  //     this.width,
  //     this.height,
  //     "WireframeFBO",
  //     new Texture(
  //       "WireframeFBOTexture",
  //       null,
  //       this.width,
  //       this.height,
  //       "RGBA16F", // Changed from RGBA8
  //       "LINEAR",
  //       "RGBA",
  //       "FLOAT", // Changed from UNSIGNED_BYTE
  //       "CLAMP_TO_EDGE"
  //     ),
  //     true,
  //     true
  //   );
  //   this.passes.set("wireframe", this.wireframePass);
  // }

  // createVertexPointsPass() {
  //   this.vertexPointsPass = new RenderTarget(
  //     this.width,
  //     this.height,
  //     "VertexPointsFBO",
  //     new Texture(
  //       "VertexPointsFBOTexture",
  //       null,
  //       this.width,
  //       this.height,
  //       "RGBA16F",
  //       "LINEAR",
  //       "RGBA",
  //       "FLOAT",
  //       "CLAMP_TO_EDGE"
  //     ),
  //     true,
  //     true
  //   );
  //   this.passes.set("vertexPoints", this.vertexPointsPass);
  // }

  // createGizmoPass() {
  //   this.gizmoPass = new RenderTarget(
  //     this.width,
  //     this.height,
  //     "GizmoFBO",
  //     new Texture(
  //       "GizmoFBOTexture",
  //       null,
  //       this.width,
  //       this.height,
  //       "RGBA16F",
  //       "LINEAR",
  //       "RGBA",
  //       "FLOAT",
  //       "CLAMP_TO_EDGE"
  //     ),
  //     true,
  //     false
  //   );
  //   this.passes.set("gizmo", this.gizmoPass);
  // }

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
    // this.createVertexPointsPass();

    // adjust sidepanel offset
    this.sidepanel.setOffset(offset_x);

    /* update camera viewport */
    this.mainCamera.aspect = width / height;
    this.mainCamera.updateProjectionMatrix();

    // remove drawViewportDebugMask
    this.removeDebuggingOutlines();
  }
  setAspect(aspect) {
    this.mainCamera.aspect = aspect;
    this.mainCamera.updateProjectionMatrix();
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

  render(renderer, mode = this.renderMode) {
    // const pipeline = new RenderPipeline();

    // console.error(this.scene.getHierarchyList());
    renderer.render(
      this.scene,
      this.mainCamera,
      this.solidPass.target,
      RenderMode.SOLID,
      this.viewportArea
    );
    renderer.render(
      this.scene,
      this.mainCamera,
      this.wireframePass.target,
      RenderMode.WIREFRAME,
      this.viewportArea
    );
    renderer.render(
      this.scene,
      this.mainCamera,
      this.gizmoPass.target,
      RenderMode.GIZMOS,
      this.viewportArea
    );
    // renderer.render(
    //   this.scene,
    //   this.mainCamera,
    //   this.vertexPointsPass.target,
    //   RenderMode.POINT,
    //   this.viewportArea
    // );
  }

  prepareListeners() {
    this.sidepanel.buttons["Solid"].onClick = () => {
      if (this.renderMode == RenderMode.SOLID) {
        this.renderMode = RenderMode.WIREFRAME;
        this.sidepanel.buttons["Solid"].setAttribute("title", "Wireframe");
        this.sidepanel.buttons["Solid"].setAttribute(
          "icon",
          `resources/img/icon_wireframe.svg`
        );
      } else {
        this.renderMode = RenderMode.SOLID;
        this.sidepanel.buttons["Solid"].setAttribute("title", "Solid");
        this.sidepanel.buttons["Solid"].setAttribute(
          "icon",
          `resources/img/icon_solid.svg`
        );
      }
    };
    this.sidepanel.buttons["Shaded"].onClick = () => {
      this.renderMode = RenderMode.SHADED;
    };
    this.sidepanel.buttons["Grid"].onClick = () => {
      // this.scene.toggleGrid();
    };
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
