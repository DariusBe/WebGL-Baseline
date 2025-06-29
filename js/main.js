import { GLContext } from "./GLContext.js";
import { LegacyShader } from "./LegacyShader.js";
import { Utils } from "./Utils.js";
import { ModelOBJ } from "./ModelOBJ.js";
import { CanvasShader } from "./src/canvasShader/CanvasShader.js";
import { MultiPassShader } from "./src/blurShader/MultiPassShader.js";
import { Attribute } from "./Attribute.js";
import { Uniform } from "./Uniform.js";
import "../gl-matrix-min.js";

/* Globals */
const glContext = GLContext.getInstance();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
const canvas = glContext.canvas;

const BYTE = 4;

// render vars
const KERNELSIZE = 9; // kernel size for blur

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

/* CANVAS */
const map = await Utils.loadImage("fun.jpg");
// scale the webgl canvas to "cover" image with correct aspect ratio
canvas.width = map.width;
canvas.height = map.height * (canvas.width / map.width);
gl.viewport(0, 0, canvas.width, canvas.height);

/* CANVAS */
const canvasShader = new CanvasShader(
  "CanvasShader",
  attributes,
  uniforms,
  map
);

/* BLUR */
const kernel = Utils.gaussKernel1D(KERNELSIZE, KERNELSIZE / 6);
const testUniforms = [
  new Uniform("uKernelSize", "1i", KERNELSIZE),
  new Uniform("uKernel", "1fv", kernel),
];
const blurShader = new MultiPassShader(
  "BlurShader",
  canvasShader.texture,
  attributes,
  testUniforms,
  null
);
/* SET ALL SHADERS GLOBAL */
for (const shader of shaderList) {
  shader.logShaderInfo();
}

glContext.animate(() => {
  blurShader.render();
  canvasShader.render();
});

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
