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

// setting up mars
const mars = await SceneObject.createFromOBJ(
  "resources/models/planet.obj",
  "resources/models/planet.mtl"
);
mars.transform.setScale(0.4, 0.4, 0.4);
const marsTex = new Texture(
  "MarsTexture",
  await Utils.loadImage("resources/textures/mars.jpg", 1440, 720),
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

// setting up europa
const europaTex = new Texture(
  "EuropaTexture",
  await Utils.loadImage("resources/textures/europa.png", 1024, 512),
  1024,
  512,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const europa = await SceneObject.createFromOBJ(
  "resources/models/planet.obj",
  "resources/models/planet.mtl"
);
europa.transform.setScale(0.25, 0.25, 0.25);
europa.transform.setTranslation(2, 0.0, 0.0);
const europaMaterial = new Material("EuropaMaterial", null, null, europaTex);
europa.addMaterial(europaMaterial, false);
europa.activeMaterial = europaMaterial;
mars.addChild(europa);

// setting up moon
const moonTex = new Texture(
  "MoonTexture",
  await Utils.loadImage("resources/textures/moon.png", 1024, 512),
  1024,
  512,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const moon = await SceneObject.createFromOBJ(
  "resources/models/planet.obj",
  "resources/models/planet.mtl"
);
moon.transform.setScale(0.4, 0.4, 0.4);
moon.transform.setTranslation(2.0, 0.0, 0.0);
const moonMaterial = new Material("MoonMaterial", null, null, moonTex);
moon.addMaterial(moonMaterial, false);
moon.activeMaterial = moonMaterial;
europa.addChild(moon);

// setting up renderer
const renderer = new Renderer();

const mainCamera = new Camera("mainCamera");
mainCamera.transform.setTranslation(0, 0, 2); // Default position

// animate;
const animate = () => {
  glContext.updateUniforms();
  mars.transform.rotate(0, Math.PI * -0.0005, Math.PI * -0.000005);

  europa.transform.rotate(0, Math.PI * 0.002, Math.PI * 0.0000012);

  moon.transform.rotate(0, Math.PI * -0.003, 0);

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
