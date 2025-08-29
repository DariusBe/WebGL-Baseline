import { GLContext } from "../GL/GLContext.js";
import { Topbar } from "./Topbar.js";
import { Sidepanel } from "./Sidepanel.js";

import { Renderer } from "../Scene/Renderer.js";
import { Scene } from "../Scene/Scene.js";
import { Viewport } from "./Viewport.js";
import { SceneObject } from "../Scene/SceneObject.js";
import { Material } from "../Shading/Material.js";
import { Texture } from "../Shading/Texture.js";
import { Utils } from "../Utils/Utils.js";

export class Editor {
  constructor() {
    /** @type {WebGLRenderingContext} */
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.canvas = this.gl.canvas;
    this.sceneHistory = [];

    this.viewports = [];
    const viewport3D = new Viewport(500, this.canvas.height);
    this.viewports.push(viewport3D);

    /* UI */
    this.topbar = new Topbar();
    this.sidepanel = new Sidepanel();
    /* Globals */
    this.scene = new Scene();
    this.registerUndoableStep();
    this.renderer = new Renderer();

    // // Add this before creating render targets
    // const devicePixelRatio = window.devicePixelRatio || 1;
    // const canvasWidth = this.canvas.clientWidth * devicePixelRatio;
    // const canvasHeight = this.canvas.clientHeight * devicePixelRatio;
    // // Update canvas actual size
    // this.gl.canvas.width = canvasWidth;
    // this.gl.canvas.height = canvasHeight;

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
          /*
          mars.transform.setScale(0.1, 0.1, 0.1);
          const marsTex = new Texture(
            "MarsTexture",
            await Utils.loadImage("resources/textures/Mars.jpg", 1440, 720),
            1440,
            720,
            "RGBA16F",
            "LINEAR",
            "RGBA",
            "FLOAT",
            "CLAMP_TO_EDGE"
          );
          const marsMaterial = new Material("MarsMaterial", null, null, marsTex);
          mars.addMaterial(marsMaterial, true);
          mars.solidMaterial = marsMaterial; // Set solid material
          mars.activeMaterial = marsMaterial;
          mars.name = "Mars";
          editor.scene.add(mars);
          */
        });
      }
    });
  }

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

  registerUndoableStep = () => {
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
