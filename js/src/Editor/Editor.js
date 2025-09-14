import { GLContext } from "../GL/GLContext.js";
import { Topbar } from "./GUI/Topbar.js";
import { Sidepanel } from "./GUI/Sidepanel.js";
import { AboutPopup } from "./GUI/AboutPopup.js";
import { IconButton } from "./GUI/IconButton.js";
import { Separator } from "./GUI/Separator.js";

import { Renderer } from "./Rendering/Renderer.js";
import { Scene } from "../Scene/Scene.js";
import { Viewport } from "./Viewport.js";
import { SceneObject } from "../Scene/SceneObject.js";
import { Material } from "../Shading/Material.js";
import { Texture } from "../Shading/Texture.js";
import { Utils } from "../Utils/Utils.js";
import { Lamp } from "../Scene/Lamp.js";
import { Grid } from "../Scene/SceneExtras.js";
import { RenderMode } from "./Rendering/RenderPass.js";
import { Camera } from "../Scene/Camera.js";
import { Transform } from "../Geom/Transform.js";
import { Gizmo } from "../Scene/SceneExtras.js";

const overtSphere = await SceneObject.createFromOBJ(
  "resources/models/0vert.obj",
  "resources/models/0vert.mtl"
);

const testmap = new Texture(
  "TestTexture",
  await Utils.loadImage("resources/textures/oVertSphere_AO.png", 1024, 1024),
  1024,
  1024,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);

export class Editor {
  constructor() {
    /** @type {WebGLRenderingContext} */
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.canvas = this.gl.canvas;
    this.sceneHistory = [];
    this.viewports = [];
    this.separators = [];

    /* Globals */
    this.scene = new Scene();
    this.renderer = new Renderer();

    /* Viewports */
    this.viewport3D_1 = new Viewport(
      this.canvas.width,
      this.canvas.height,
      this.scene
    );
    this.viewports.push(this.viewport3D_1);

    /* Initial Objects */
    overtSphere.transform.setScale(1.0, 1.0, 1.0);
    const testMaterial = new Material("OvertMaterial", null, null, testmap);
    overtSphere.addMaterial(testMaterial, true);
    overtSphere.solidMaterial = testMaterial; // Set solid material
    overtSphere.activeMaterial = testMaterial;
    overtSphere.name = "OvertSphere";
    this.scene.add(overtSphere);

    const lamp = new Lamp("Sun", "lamp", 1.0);
    lamp.transform.setTranslation(3.0, 2.5, -5.0);
    this.scene.add(lamp);

    const grid = new Grid("Grid", 500, 500);
    this.scene.add(grid);

    /* GUI */
    this.topbar = new Topbar();
    // this.sidepanel = new Sidepanel();
    this.aboutPopup = new AboutPopup();
    this.updateViewportsOnDrag();

    /* GUI Listeners */
    this.prepareListeners();

    // // Add this before creating render targets
    // const devicePixelRatio = window.devicePixelRatio || 1;
    // const canvasWidth = this.canvas.clientWidth * devicePixelRatio;
    // const canvasHeight = this.canvas.clientHeight * devicePixelRatio;
    // // Update canvas actual size
    // this.gl.canvas.width = canvasWidth;
    // this.gl.canvas.height = canvasHeight;
  }

  /* RENDERING */
  render = () => {
    this.glContext.updateUniforms();
    for (const view of this.viewports) {
      // render solid
      view.render(this.renderer, RenderMode.GIZMOS);
      view.render(this.renderer, RenderMode.WIREFRAME);
      view.render(this.renderer, RenderMode.SOLID);
      // view.render(this.renderer, RenderMode.POINT);

      this.renderer.renderScreenQuad(
        [
          view.solidPass.texture,
          view.wireframePass.texture,
          view.gizmoPass.texture,
          // view.vertexPointsPass.texture,
        ],
        view.viewportArea
      );
    }
    requestAnimationFrame(this.render);
  };

  updateViewportsOnDrag = () => {
    // iterate viewport list with index

    if (this.viewports.length > 1) {
      this.topbar.windowContext.get("Collapse").isEnabled = true;
    }

    for (let i = 1; i < this.viewports.length; i++) {
      const viewportOffset_left = this.viewports[i].viewportArea.x0;
      let separator = new Separator(viewportOffset_left);
      this.separators.push(separator);

      const viewportRight = this.viewports[i];
      const viewportLeft = this.viewports[i - 1];
      separator.element.addEventListener("separator-move", (e) => {
        const offset = e.detail.offset;

        // set viewport left of separator to new size
        viewportLeft.viewportArea.xMax = offset;
        viewportLeft.drawViewportDebugMask();

        // set viewport right of separator to new size
        viewportRight.viewportArea.x0 = offset;
        viewportRight.viewportArea.xMax = this.canvas.width - offset;
        viewportRight.drawViewportDebugMask();
        viewportRight.sidepanel.setOffset(offset + separator.width);
      });

      separator.element.addEventListener("separator-stop", (e) => {
        const offset = e.detail.offset;

        viewportLeft.resize(offset, this.canvas.height, 0, 0);
        viewportRight.resize(
          this.canvas.width - separator.width - offset,
          this.canvas.height,
          offset + separator.width,
          0
        );
        viewportLeft.removeDebuggingOutlines();
        viewportRight.removeDebuggingOutlines();
      });
    }
  };

  getViewportAtMouse(x, y) {
    if (this.viewports.length === 1) {
      return this.viewports[0];
    } else {
      const leftVP = this.viewports[0];
      const rightVP = this.viewports[1];
      if (x < leftVP.viewportArea.xMax && y < leftVP.viewportArea.yMax) {
        return leftVP;
      } else if (x > rightVP.viewportArea.x0 && y < rightVP.viewportArea.yMax) {
        return rightVP;
      }
    }
    return null;
  }

  /* LISTENERS */
  prepareListeners = () => {
    // register scroll in viewport (camera zoom)
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.05;
      const zoomAmount = e.deltaY * zoomSensitivity;
      if (e.deltaY < 0) this.canvas.style.cursor = "zoom-out";
      else this.canvas.style.cursor = "zoom-in";

      const effectedViewport = this.getViewportAtMouse(e.clientX, e.clientY);
      if (effectedViewport) {
        effectedViewport.mainCamera.zoom(zoomAmount);
      }
    });

    // register mousemove in viewport (camera orbit)
    this.canvas.addEventListener("mousemove", (e) => {
      const deltaX = e.movementX;
      const deltaY = e.movementY;
      this.canvas.style.cursor = "crosshair";

      // if click, pick object of respective viewport
      if (e.buttons & 1 && !e.altKey) {
        const viewport = this.getViewportAtMouse(e.clientX, e.clientY);
        if (viewport) {
          viewport.pickObjects(e.clientX, e.clientY);
        }
      }

      // if Alt Key + Left Mouse Button
      if (e.altKey && e.buttons & 1) {
        // left mouse button held
        this.canvas.style.cursor = "all-scroll";
        e.preventDefault();

        const effectedViewport = this.getViewportAtMouse(e.clientX, e.clientY);

        if (effectedViewport) {
          effectedViewport.mainCamera.orbitAround(
            deltaX,
            deltaY,
            glMatrix.vec3.fromValues(0, 0, 0)
          );
        } else {
          this.viewports[0].mainCamera.orbitAround(
            deltaX,
            deltaY,
            glMatrix.vec3.fromValues(0, 0, 0)
          );
        }
      } else {
        this.canvas.style.cursor = "crosshair";
      }
    });

    /* File Menu */
    this.topbar.addEventListener("file_new", (e) => {
      console.log("Editor received new file event");
      console.log(e.detail);

      // show stylable prompt before deleting scene
      const confirmDelete = confirm(
        "Are you sure you want to delete the current scene?"
      );

      if (confirmDelete) {
        this.scene = new Scene();

        this.viewport3D_1.scene = this.scene;
        this.viewport3D_1 = new Viewport(
          this.canvas.width,
          this.canvas.height,
          this.scene
        );
      }
    });

    this.topbar.addEventListener("file_import", (e) => {
      const { contents, extension } = e.detail;
      if (extension === "obj") {
        // Pass contents directly to your parser
        const obj = SceneObject.createFromOBJ(contents, null, true, true);
        // resolve promise
        obj.then(async (instance) => {
          const res = instance;
          if (res.name) {
            res.name = obj.name;
          }
          res.transform.setScale(1.0, 1.0, 1.0);
          const resTexture = new Texture(
            `${res.name}_Texture`,
            await Utils.loadImage(
              "resources/textures/0vertUVMap.png",
              2048,
              2048
            ),
            2048,
            2048,
            "RGBA16F",
            "LINEAR",
            "RGBA",
            "FLOAT",
            "CLAMP_TO_EDGE"
          );
          const resMaterial = new Material(
            `${res.name}_Material`,
            null,
            null,
            resTexture
          );
          res.addMaterial(resMaterial, true);
          res.solidMaterial = resMaterial;
          res.activeMaterial = resMaterial;

          this.scene.add(res);
        });
      }
    });

    this.topbar.addEventListener("window_split", (e) => {
      const count = this.viewports.length;
      if (count >= 2) {
        console.warn("Maximum number of viewports reached");
        return;
      }
      const viewport3D_2 = new Viewport(
        this.canvas.width,
        this.canvas.height,
        this.scene
      );
      this.viewports.push(viewport3D_2);
      this.updateViewportsOnDrag();
    });

    this.topbar.addEventListener("window_collapse", (e) => {
      const count = this.viewports.length;
      if (count <= 1) return; // at least one viewport
      // remove the last viewport
      const viewportToRemove = this.viewports[this.viewports.length - 1];
      viewportToRemove.destroy();

      // remove from viewports array
      this.viewports.pop();
      this.updateViewportsOnDrag();
      // remove all separators
      this.separators.forEach((separator) => separator.remove());
      this.separators = [];

      // resize viewport[0]
      this.viewports[0].resize(this.canvas.width, this.canvas.height);
    });

    this.topbar.addEventListener("help_about", (e) => {
      this.aboutPopup.setVisible(true);
    });
  };

  registerUndoRedoStep = () => {
    this.sceneHistory.push(JSON.stringify(this.scene));
  };
}

/*
const animate = () => {
  glContext.updateUniforms();
  const mouse = glContext.uMouse;

  // transformations
  const k = 0.5;
  mars.transform.rotate(0, pi * -0.001 * k, 0);
  // earth.transform.rotate(0, pi * 0.01 * k, pi * 0.0000012);
  // moon.transform.rotate(0, pi * -0.01 * k, 0);
  // decalCube.transform.rotate(0, pi * -0.01 * k, 0);

  // render the scene: solid pass, wireframe pass into FBOs
  renderer.render(scene, mainCamera, wireframePass, "wireframe");
  renderer.render(scene, mainCamera, solidPass, "solid");
  renderer.render(scene, mainCamera, gizmoPass, "gizmo");

  // render the solid and wireframe passes to the screen
  renderer.renderScreenQuad([
    solidPass.targetTexture,
    wireframePass.targetTexture,
    gizmoPass.targetTexture,
  ]);
  // picking
  // pick objects on mouse click

  if (mouse[2] == 1.0) {
    pickObjects(mouse[0] * 2, mouse[1] * 2);
    glContext.uMouse[2] = 0.0; // Reset mouse click state
  }
  requestAnimationFrame(animate);
};
*/
