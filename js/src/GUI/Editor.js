import { GLContext } from "../GL/GLContext.js";
import { Renderer } from "../Scene/Renderer.js";
import { Scene } from "../Scene/Scene.js";
import { Viewport } from "./Viewport.js";

class ContextButton {
  constructor(action, isDisabled) {
    this.action = action;
    this.isDisabled = isDisabled;
    this.label = "";
  }
}

export class Editor {
  constructor() {
    /** @type {WebGLRenderingContext} */
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.canvas = this.gl.canvas;

    this.viewports = [];
    const viewport3D = new Viewport(500, this.canvas.height);
    this.viewports.push(viewport3D);

    /* Globals */
    this.scene = new Scene();
    this.renderer = new Renderer();

    // // Add this before creating render targets
    // const devicePixelRatio = window.devicePixelRatio || 1;
    // const canvasWidth = this.canvas.clientWidth * devicePixelRatio;
    // const canvasHeight = this.canvas.clientHeight * devicePixelRatio;
    // // Update canvas actual size
    // this.gl.canvas.width = canvasWidth;
    // this.gl.canvas.height = canvasHeight;
    this.prepareTopbar();
  }

  prepareTopbar = () => {
    var menu_popupVisible = false;

    // const fileContext = new Map([
    //   [
    //     "New...",
    //     [
    //       () => {
    //         console.log("// ADD FUNCTIONALITY FOR NEW HERE");
    //       },
    //       true,
    //     ],
    //   ],
    //   [
    //     "Import...",
    //     [
    //       () => {
    //         console.log("// ADD FUNCTIONALITY FOR IMPORT HERE");
    //       },
    //       true,
    //     ],
    //   ],
    // ]);
    const fileContext = new Map([
      [
        "New...",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR NEW HERE");
        }, true),
      ],
      [
        "Import...",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR IMPORT HERE");
        }, true),
      ],
    ]);

    const editContext = new Map([
      [
        "Undo",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR UNDO HERE");
        }, true),
      ],
      [
        "Redo",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR REDO HERE");
        }, true),
      ],
    ]);

    const selectionContext = new Map([
      [
        "Select All",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR SELECT ALL HERE");
        }, true),
      ],
      [
        "Deselect All",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR DESELECT ALL HERE");
        }, true),
      ],
    ]);

    const viewContext = new Map([
      [
        "Toggle Wireframe",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR TOGGLE WIREFRAME HERE");
        }, true),
      ],
      [
        "Hide Extras",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR HIDE EXTRAS HERE");
        }, true),
      ],
      [
        "Reset Camera",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR RESET CAMERA HERE");
        }, true),
      ],
    ]);

    const windowContext = new Map([
      [
        "Split",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR SPLIT HERE");
        }, true),
      ],
      [
        "Collapse",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR COLLAPSE HERE");
          console.log(this.viewports.length);
        }, false),
      ],
    ]);

    const helpContext = new Map([
      [
        "Documentation",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR DOCUMENTATION HERE");
        }, true),
      ],
      [
        "About",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR ABOUT HERE");
        }, true),
      ],
    ]);

    const prepareContext = (e, contextDescription) => {
      for (const [buttonLabel, buttonProps] of contextDescription) {
        const button = document.createElement("button");
        // set button inactive if action is not allowed
        button.disabled = !buttonProps.isDisabled;
        button.textContent = buttonLabel;
        button.addEventListener("click", buttonProps.action);
        menu_popup[0].appendChild(button);
        // menu_popup to float below button (aligning either left or right, depending on available space)
        const menu_width = menu_popup[0].getBoundingClientRect().width;
        const button_rect = e.target.getBoundingClientRect();

        // Default: align left edge of popup with left edge of button
        let left = button_rect.left;

        // If not enough space to the right, align right edge of popup with right edge of button
        if (left + menu_width > window.innerWidth) {
          left = button_rect.right - menu_width;
          // Prevent negative left value
          if (left < 0) left = 0;
        }
        menu_popup[0].style.left = `${left}px`;
      }
    };

    const menu = document.getElementById("menu_items");
    const menu_popup = document.getElementsByClassName("menu_popup");
    for (const button of menu.children) {
      button.addEventListener("mouseenter", (e) => {
        // infer width of menu_popup
        menu_popup[0].innerHTML = "";

        switch (e.target.id) {
          case "file":
            prepareContext(e, fileContext);
            break;
          case "edit":
            prepareContext(e, editContext);
            break;
          case "selection":
            prepareContext(e, selectionContext);
            break;
          case "view":
            prepareContext(e, viewContext);
            break;
          case "window":
            prepareContext(e, windowContext);
            break;
          case "help":
            prepareContext(e, helpContext);
            break;
        }
      });
      button.addEventListener("click", (e) => {
        // set menu_popup visibility
        menu_popup[0].style.visibility = menu_popupVisible
          ? "hidden"
          : "visible";
        menu_popupVisible = !menu_popupVisible;
      });
      canvas.addEventListener("click", (e) => {
        menu_popup[0].style.visibility = "hidden";
        menu_popupVisible = false;
      });
    }
  };

  render = () => {
    this.glContext.updateUniforms();
    for (const view of this.viewports) {
      // console.error(view.solidPass.targetTexture);

      view.render(this.scene, this.renderer);

      this.renderer.renderScreenQuad([
        view.solidPass.targetTexture,
        view.wireframePass.targetTexture,
      ]);
    }
    requestAnimationFrame(this.render);
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
