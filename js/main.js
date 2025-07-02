import { GLContext } from "./GLContext.js";
import { LegacyShader } from "./LegacyShader.js";
import { Utils } from "./Utils.js";
import { ShaderProgram } from "./ShaderProgram.js";
import { Geometry } from "./Geometry.js";
import { Material } from "./Material.js";
import { Texture } from "./Texture.js";
import { SceneObject } from "./SceneObject.js";
import { ModelOBJ } from "./ModelOBJ.js";
import { Transform } from "./Transform.js";
import { Renderer } from "./Renderer.js";
import { Viewport } from "./Viewport.js";
import { Camera } from "./Camera.js";
import { Scene } from "./Scene.js";

import { CanvasShader } from "./src/canvasShader/CanvasShader.js";
import { MultiPassShader } from "./src/blurShader/MultiPassShader.js";
import { Attribute } from "./Attribute.js";
import { Uniform } from "./Uniform.js";
import "../gl-matrix-min.js";

/* Globals */
const glContext = GLContext.getInstance();
const gl = glContext.gl;
const shaderList = glContext.shaderList;
const canvas = glContext.canvas;

const BYTE = 4;

// render vars
const KERNELSIZE = 1; // kernel size for blur

// global uniforms and attributes
const uniforms = [
  new Uniform("uSampler", "1i", 0),
  new Uniform("uSlider", "1f", 0.5),
];
const attributes = [
  new Attribute(
    "aPosition",
    0,
    3,
    "FLOAT",
    false,
    5 * BYTE,
    0,
    Utils.canvasAttribs
  ),
  new Attribute(
    "aTexCoord",
    1,
    2,
    "FLOAT",
    false,
    5 * BYTE,
    3 * BYTE,
    Utils.canvasAttribs
  ),
];

// /* CANVAS */
// // scale the webgl canvas to "cover" image with correct aspect ratio
// canvas.width = map.width;
// canvas.height = map.height * (canvas.width / map.width);
// gl.viewport(0, 0, canvas.width, canvas.height);
// /* CANVAS */
// const canvasShader = new CanvasShader(
//   "CanvasShader",
//   attributes,
//   uniforms,
//   map
// );
// /* BLUR */
// const kernel = Utils.gaussKernel1D(KERNELSIZE, KERNELSIZE / 6);
// const testUniforms = [
//   new Uniform("uKernelSize", "1i", KERNELSIZE),
//   new Uniform("uKernel", "1fv", kernel),
// ];
// const blurShader = new MultiPassShader(
//   "BlurShader",
//   canvasShader.texture,
//   attributes,
//   testUniforms,
//   null
// );
// /* SET ALL SHADERS GLOBAL */
// for (const shader of shaderList) {
//   shader[1].logShaderInfo();
// }
// glContext.animate(() => {
//   blurShader.render();
//   canvasShader.render();
// });
const planeObject = new SceneObject();

console.info("Plane Object VAO:", planeObject);

const render = () => {
  glContext.updateUniforms();
  // planeObject.transform.setRotation(Math.PI / 4, 0, 0);
  // glContext.updateGlobalUniform("uModel", planeObject.transform.matrix);
  // glContext.cameraTransform();
  planeObject.transform.rotate(Math.PI * 0.02, 0, 0);
  planeObject.updateTransformUniforms();

  gl.useProgram(planeObject.material.shaderProgram.program);
  gl.bindVertexArray(planeObject.geometry.vao);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

// animate
const animate = () => {
  render();
  requestAnimationFrame(animate);
};
animate();

const screenshotButton = document.querySelector(".screenshotButton");
screenshotButton.addEventListener("click", () => {
  const cwidth = glContext.canvas.width;
  const cheight = glContext.canvas.height;
  const canvas = document.getElementById("webgl-canvas");
  canvas.width = canvasShader.texture.width;
  canvas.height = canvasShader.texture.height;
  gl.viewport(0, 0, canvas.width, canvas.height);
  canvasShader.render();
  const dataURL = canvas.toDataURL("image/jpg");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "canvas-screenshot.png";
  link.click();
  canvas.width = cwidth;
  canvas.height = cheight;
  gl.viewport(0, 0, cwidth, cheight);
});
