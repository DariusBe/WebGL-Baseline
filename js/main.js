import { GLContext } from "./src/GL/GLContext.js";
import { Utils } from "./src/Utils/Utils.js";
import { Material } from "./src/Shading/Material.js";
import { Texture } from "./src/Shading/Texture.js";
import { SceneObject } from "./src/Scene/SceneObject.js";
import { Scene } from "./src/Scene/Scene.js";
import { Renderer } from "./src/Scene/Renderer.js";
import { Camera } from "./src/Scene/Camera.js";
import "../gl-matrix-min.js";

/* Globals */
const glContext = GLContext.getInstance();
const gl = glContext.gl;
const scene = new Scene();

// setting up object
// const object = new SceneObject("MarsObject");
const mars = await SceneObject.createFromOBJ(
  "resources/models/mars.obj",
  "resources/models/mars.mtl"
);
const marsTex = new Texture(
  "MarsTexture",
  await Utils.loadImage("resources/models/mars.jpg", 1440, 720),
  1440,
  720,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const marsMaterial = new Material("MarsMaterial", null, null, marsTex);
mars.addMaterial(marsMaterial, false);
mars.activeMaterial = marsMaterial;
scene.add(mars);

const europaTex = new Texture(
  "EuropaTexture",
  await Utils.loadImage("resources/models/europa.png", 1024, 512),
  1024,
  512,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const europa = await SceneObject.createFromOBJ(
  "resources/models/sphere.obj",
  "resources/models/sphere.mtl"
);
europa.transform.setScale(0.5, 0.5, 0.5);
const sphereMaterial = new Material("SphereMaterial", null, null, europaTex);
europa.addMaterial(sphereMaterial, false);
europa.activeMaterial = sphereMaterial;
mars.addChild(europa);

// setting up renderer
const renderer = new Renderer();

const mainCamera = new Camera("mainCamera");
mainCamera.transform.setTranslation(0, 0, 2); // Default position

// animate;
const animate = () => {
  glContext.updateUniforms();
  mars.transform.rotate(0, Math.PI * -0.0025, 0);
  mars.transform.setScale(0.35, 0.35, 0.35);

  europa.transform.setTranslation(2, 0.0, 0.0);
  europa.transform.rotate(0, Math.PI * -0.005, 0);

  renderer.render(scene, mainCamera);
  requestAnimationFrame(animate);
};
animate();

// const screenshotButton = document.querySelector(".screenshotButton");
// screenshotButton.addEventListener("click", () => {
//   const cwidth = glContext.canvas.width;
//   const cheight = glContext.canvas.height;
//   const canvas = document.getElementById("webgl-canvas");
//   canvas.width = canvasShader.texture.width;
//   canvas.height = canvasShader.texture.height;
//   gl.viewport(0, 0, canvas.width, canvas.height);
//   canvasShader.render();
//   const dataURL = canvas.toDataURL("image/jpg");
//   const link = document.createElement("a");
//   link.href = dataURL;
//   link.download = "canvas-screenshot.png";
//   link.click();
//   canvas.width = cwidth;
//   canvas.height = cheight;
//   gl.viewport(0, 0, cwidth, cheight);
// });
