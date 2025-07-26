import { GLContext } from "./src/GL/GLContext.js";
import { Utils } from "./src/Utils/Utils.js";
import { Material } from "./src/Shading/Material.js";
import { Texture } from "./src/Shading/Texture.js";
import { SceneObject } from "./src/Scene/SceneObject.js";
import { Scene } from "./src/Scene/Scene.js";
import { Renderer } from "./src/Scene/Renderer.js";
import { Camera } from "./src/Scene/Camera.js";
import { RenderTarget } from "./src/GL/RenderTarget.js";
import { Attribute } from "./src/GL/Attribute.js";
import "../gl-matrix-min.js";
import { Geometry } from "./src/Geom/Geometry.js";
import { ShaderProgram } from "./src/GL/ShaderProgram.js";
import { Gizmo } from "./src/Scene/SceneExtras.js";
import { Lamp } from "./src/Scene/Lamp.js";
import { Grid } from "./src/Scene/SceneExtras.js";

import { Bezier } from "./src/Scene/SceneExtras.js";

/* Globals */
const glContext = GLContext.getInstance();
const gl = glContext.gl;
const scene = new Scene();
const pi = Math.PI;

const lamp = new Lamp("Sun", "lamp", 1.0);
// const lampGizmo = new Gizmo("LampGizmo", "lamp");
// lampGizmo.transform.setTranslation(0.75, 0, 0);
// lampGizmo.transform.setScale(0.025, 0.025, 0.025);
lamp.transform.setTranslation(0.75, 0, 0);
// scene.add(lamp);

// const grid = new Grid("Grid", 10.0, 100.0);
// scene.add(grid);

// MARS
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
mars.solidMaterial = marsMaterial; // Set solid material
mars.activeMaterial = marsMaterial;
mars.name = "Mars";
scene.add(mars);

// EARTH
const earthTex = new Texture(
  "EarthTexture",
  await Utils.loadImage("resources/textures/earth.png", 1024, 512),
  1024,
  512,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const earth = await SceneObject.createFromOBJ(
  "resources/models/planet.obj",
  "resources/models/planet.mtl"
);
earth.transform.setScale(0.25, 0.25, 0.25);
earth.transform.setTranslation(2.5, 0.0, 0.0);
const earthMaterial = new Material("EarthMaterial", null, null, earthTex);
earth.addMaterial(earthMaterial, false);
earth.activeMaterial = earthMaterial;
earth.solidMaterial = earthMaterial; // Set solid material
earth.activeMaterial.setTexture(earthTex, 0, "uSampler");
earth.name = "Earth";
mars.addChild(earth);

// MOON
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
moon.transform.setTranslation(2.0, 0.0, 2.0);
const moonMaterial = new Material("MoonMaterial", null, null, moonTex);
moon.addMaterial(moonMaterial, false);
moon.solidMaterial = moonMaterial; // Set solid material
moon.activeMaterial = moonMaterial;
moon.name = "Moon";
earth.addChild(moon);

// // testing Bezier Curve
// const bezier = new Bezier("BezierCurve");
// scene.add(bezier);

// setting up renderer
const renderer = new Renderer();
const mainCamera = new Camera("mainCamera");
mainCamera.transform.setTranslation(0, 1, -15); // Default position
mainCamera.fov = 8; // Default field of view

// Add this before creating render targets
const devicePixelRatio = window.devicePixelRatio || 1;
const canvasWidth = gl.canvas.clientWidth * devicePixelRatio;
const canvasHeight = gl.canvas.clientHeight * devicePixelRatio;

// Update canvas actual size
gl.canvas.width = canvasWidth;
gl.canvas.height = canvasHeight;

// create an FBO for rendering the scene with DPR
const solidPass = new RenderTarget(
  canvasWidth,
  canvasHeight,
  "SolidFBO",
  new Texture(
    "SolidFBOTexture",
    null,
    canvasWidth,
    canvasHeight,
    "RGBA8",
    "LINEAR",
    "RGBA",
    "UNSIGNED_BYTE",
    "CLAMP_TO_EDGE"
  ),
  true
);

const wireframePass = new RenderTarget(
  canvasWidth,
  canvasHeight,
  "WireframeFBO",
  new Texture(
    "WireframeFBOTexture",
    null,
    canvasWidth,
    canvasHeight,
    "RGBA8",
    "LINEAR",
    "RGBA",
    "UNSIGNED_BYTE",
    "CLAMP_TO_EDGE"
  ),
  true
);

// animate;
const animate = () => {
  glContext.updateUniforms();

  mars.transform.rotate(0, pi * -0.0005, 0);

  earth.transform.rotate(0, pi * 0.002, pi * 0.0000012);

  moon.transform.rotate(0, pi * -0.003, 0);

  renderer.render(scene, mainCamera, solidPass, null, "solid");
  renderer.render(scene, mainCamera, wireframePass, null, "wireframe");

  // render the plane with the canvas shader
  renderer.renderScreenQuad([
    solidPass.targetTexture,
    wireframePass.targetTexture,
  ]);

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
//   gl.viewport(0, 0, cwidth, cheight);w
// });
