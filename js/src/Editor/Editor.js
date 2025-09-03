import { GLContext } from "../GL/GLContext.js";
import { Topbar } from "./Topbar.js";
import { Sidepanel } from "./Sidepanel.js";
import { AboutPopup } from "./AboutPopup.js";
import { IconButton } from "./IconButton.js";

import { Renderer } from "../Scene/Renderer.js";
import { Scene } from "../Scene/Scene.js";
import { Viewport } from "./Viewport.js";
import { SceneObject } from "../Scene/SceneObject.js";
import { Material } from "../Shading/Material.js";
import { Texture } from "../Shading/Texture.js";
import { Utils } from "../Utils/Utils.js";

class Separator extends EventTarget {
  constructor(offset) {
    super();
    this.element = document.createElement("div");
    this.element.id = "separator";
    this.dirty = false; // = needs redrawing

    // Add class for styling
    this.element.classList.add("separator");
    this.setPosition(offset || 200, 0); // Default position if none provided
    document.body.appendChild(this.element);
    this.width = this.element.offsetWidth;

    const stop = document.createElement("div");
    stop.classList.add("separator-stop");
    this.element.appendChild(stop);
    this.element.appendChild(stop.cloneNode(true));
    this.element.appendChild(stop.cloneNode(true));

    // when dirty changes, dispatch an event
    Object.defineProperty(this, "dirty", {
      set(value) {
        this._dirty = value;
        this.element.dispatchEvent(new CustomEvent("dirty", { detail: value }));
      },
      get() {
        return this._dirty;
      },
    });

    let dragging = false;

    this.element.addEventListener("mousedown", (e) => {
      dragging = true;
      document.body.style.cursor = "col-resize";
      e.preventDefault();

      const onMouseMove = (e) => {
        if (!dragging) return;
        const newX = Math.max(0, e.clientX); // Clamp to left edge
        this.setPosition(newX);
        this.element.dispatchEvent(
          new CustomEvent("separator-move", { detail: { offset: newX } })
        );
      };

      const onMouseUp = () => {
        dragging = false;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        this.element.dispatchEvent(
          new CustomEvent("separator-stop", {
            detail: { offset: this.element.offsetLeft },
          })
        );
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  setPosition = (offset) => {
    this.element.style.left = `${offset}px`;
  };

  remove = () => {
    this.element.remove();
  };
}

export class Editor {
  constructor() {
    /** @type {WebGLRenderingContext} */
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.canvas = this.gl.canvas;
    this.sceneHistory = [];
    this.viewports = [];
    this.separators = [];

    this.viewport3D_1 = new Viewport(this.canvas.width, this.canvas.height);
    this.viewports.push(this.viewport3D_1);

    // this.viewport3D.setSize(200, 200);

    /* UI */
    this.topbar = new Topbar();
    // this.sidepanel = new Sidepanel();
    this.aboutPopup = new AboutPopup();
    this.updateSeparator();

    /* Globals */
    this.scene = new Scene();
    this.registerUndoRedoStep(); // @@TODO: Implement undo/redo functionality
    this.renderer = new Renderer();

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
      // console.error(view.solidPass.targetTexture);

      view.render(this.scene, this.renderer);

      this.renderer.renderScreenQuad(
        [view.solidPass.targetTexture, view.wireframePass.targetTexture],
        view.viewportArea
      );
    }
    requestAnimationFrame(this.render);
  };

  updateSeparator = () => {
    // iterate viewport list with index

    if (this.viewports.length > 1) {
      this.topbar.windowContext.get("Collapse").isEnabled = true;
    }

    for (let i = 1; i < this.viewports.length; i++) {
      const viewportOffset_left = this.viewports[i].viewportArea.x0;
      let separator = new Separator(viewportOffset_left);
      this.separators.push(separator);

      const viewportRight = this.viewports[i];
      separator.element.addEventListener("separator-move", (e) => {
        const offset = e.detail.offset;
        viewportRight.viewportArea.x0 = offset;
        viewportRight.viewportArea.xMax = this.canvas.width - offset;
        viewportRight.drawDebuggingOutlines();
      });

      separator.element.addEventListener("separator-stop", (e) => {
        const offset = e.detail.offset;

        viewportRight.resize(
          this.canvas.width - separator.width - offset,
          this.canvas.height,
          offset + separator.width,
          0
        );
        viewportRight.removeDebuggingOutlines();
      });
    }
  };

  /* LISTENERS */
  prepareListeners = () => {
    // register scroll in viewport (camera orbit)
    this.canvas.addEventListener("mousemove", (e) => {
      if (e.altKey && e.buttons & 1) {
        // left mouse button held
        this.canvas.style.cursor = "move";
        e.preventDefault();

        const deltaX = e.movementX;
        const deltaY = e.movementY;

        this.viewports[0].mainCamera.orbitAround(
          deltaX,
          deltaY,
          glMatrix.vec3.fromValues(0, 0, 0)
        );
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
            res.name = "ImportedObj";
          }
          res.transform.setScale(0.05, 0.05, 0.05);
          const resTexture = new Texture(
            `${res.name}_Texture`,
            await Utils.loadImage("resources/textures/Mars.jpg", 1440, 720),
            1440,
            720,
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
      if (count >= 2) return; // max 4 viewports for now
      const viewport3D_2 = new Viewport(this.canvas.width, this.canvas.height);
      this.viewports.push(viewport3D_2);
      this.updateSeparator();
    });

    this.topbar.addEventListener("window_collapse", (e) => {
      const count = this.viewports.length;
      if (count <= 1) return; // at least one viewport
      this.viewports.pop();
      this.updateSeparator();
      // remove all separators
      this.separators.forEach((separator) => separator.remove());
      this.separators = [];
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
