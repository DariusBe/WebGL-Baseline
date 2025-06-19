import { GLContext } from "./GLContext.js";
import { Shader } from "./Shader.js";
import { Utils } from "./Utils.js";
import { ModelOBJ } from "./ModelOBJ.js";
import { CanvasShader } from "./src/canvasShader/CanvasShader.js";
import { MultiPassShader } from "./src/blurShader/MultiPassShader.js";
import "../gl-matrix-min.js";

/* Globals */
const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
const canvas = glContext.canvas;

const BYTE = 4;

// render vars
const KERNELSIZE = 13; // kernel size for blur

// global uniforms and attributes
const globalUniforms = {
  uSampler: ["1i", 0],
  uSlider: ["1f", 0.5],
};

const globalAttributes = {
  aPosition: [0, [3, "FLOAT", false, 5 * BYTE, 0], Utils.canvasAttribs],
  aTexCoord: [1, [2, "FLOAT", false, 5 * BYTE, 3 * BYTE], Utils.canvasAttribs],
};

/* CANVAS */
const map = await Utils.loadImage("fun.jpg");
// scale the webgl canvas to "cover" image with correct aspect ratio
canvas.width = map.width;
canvas.height = map.height * (canvas.width / map.width);
gl.viewport(0, 0, canvas.width, canvas.height);

/* CANVAS */
const canvasShader = new CanvasShader(
  glContext,
  "CanvasShader",
  globalAttributes,
  null,
  map
);

/* BLUR */
const blurUniforms = Object.assign({}, globalUniforms, {
  uKernelSize: ["1i", KERNELSIZE],
  uKernel: ["1fv", Utils.gaussKernel1D(KERNELSIZE, KERNELSIZE / 6)],
});
const blurShader = new MultiPassShader(
  glContext,
  "BlurShader",
  canvasShader.texture,
  globalAttributes,
  blurUniforms,
  null,
  false // single pass
);
/* SET ALL SHADERS GLOBAL */
for (const shader of shaderList) {
  shader.getShaderDetails();
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
