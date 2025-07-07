import { GLContext } from "../../GL/GLContext.js";
import { Texture } from "../Texture.js";
import { LegacyShader } from "../LegacyShader.js";
import { Utils } from "../../Utils/Utils.js";
import "../../../../gl-matrix-min.js";
const glsl = (x) => x;

var vertCode = glsl`#version 300 es
precision mediump float;

layout(location=0) in vec2 aPosition;
layout(location=1) in vec2 aTexCoord;

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

var fragCode = glsl`#version 300 es
//#pragma vscode_glsllint_stage : frag
// precision highp sampler2D;
precision mediump float;

#define PI 3.14159265359

// texture data
in vec2 vTexCoord;
uniform sampler2D uSampler; // texture unit 0

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
uniform float uAttenuation;
uniform int uKernelSize;
uniform float uKernel[99];
uniform bool uIsHorizontal;
uniform vec2 uNutrients[500];
uniform int uNutrientCount;

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize mouse position
    vec2 mouse = uMouse.xy;

    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (length(gl_FragCoord.xy - mouse) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

vec4 applyKernel() {
    vec2 texelSize = 1.0f / uResolution;
    vec4 sum = vec4(0.0f);
    int range = uKernelSize / 2;
    for (int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0f, float(i) * texelSize);
        if (uIsHorizontal) {
            offset = offset.yx;
        }
        sum += texture(uSampler, vTexCoord + offset) * uKernel[i + range];
    }
    return sum;
}

float random(float seed) {
    return fract(sin(seed) * 43758.5453123f);
}

float randomSign(float seed) {
    return random(seed) > 0.5f ? 1.0f : -1.0f;
}

void main() {
    if (uKernelSize >= 3) {
        fragColor = applyKernel();
    } else {
        fragColor = texture(uSampler, vTexCoord);
    }
    fragColor = vec4(fragColor.rgb, 1.0f) - prepareCursor(50.0f, vec4(0.0, 0.0, 0.0, 0.5f));
  }
`;

/**
 * MultiPassShader class for performing multi-pass image processing
 * such as blurring using a two-pass shader approach.
 * @class MultiPassShader
 * @extends LegacyShader
 * @param {GLContext} glContext - The WebGL context.
 * @param {string} name - The name of the shader.
 * @param {Object} inOutTexture - The input/output texture for the shader.
 * @param {Object} globalAttributes - Global attributes for the shader.
 * @param {Object} globalUniforms - Global uniforms for the shader.
 * @param {ImageData} imageMap - Optional image data to create the inOutTexture.
 * @param {boolean} singlePass - Whether to use a single pass or two passes for processing.
 * @description This shader is designed to perform operations like blurring
 * by rendering the input texture into an intermediate texture and then
 * applying the blur in a second pass.
 * It can be used for various image processing tasks that require multiple rendering passes.
 * The shader uses a framebuffer object (FBO) to render the intermediate results.
 * The shader can be configured to operate in either horizontal or vertical blur mode,
 * and it supports a single-pass mode for simpler operations.
 *
 * @example
 * const multiPassShader = new MultiPassShader(glContext, "BlurShader", inOutTexture, globalAttributes, globalUniforms, imageMap, false);
 * multiPassShader.render();
 *
 * @see {@link LegacyShader} for the base shader class.
 * @see {@link GLContext} for the WebGL context management.
 * @see {@link Texture} for texture handling.
 * @see {@link Utils} for utility functions like kernel generation.
 * @see {@link vertCode} and {@link fragCode} for the vertex and fragment shader code.
 *
 * @author Darius B.
 * @version 1.0.0
 * @since 1.0.0
 * @license https://creativecommons.org/licenses/by-nc-sa/4.0/
 */
export class MultiPassShader extends LegacyShader {
  name = "MultiPassShader";
  glContext = null;
  gl = null;
  inOutTexture = null;
  intermediateTexture = null;
  map = null;
  attributes = null;
  uniforms = null;
  uIsHorizontal = true; // true for horizontal blur, false for vertical blur
  direction = "horizontal"; // direction of the blur
  singlePass = false;
  width = 0;
  height = 0;

  constructor(
    name = this.name,
    inOutTexture,
    attributes = this.attributes,
    uniforms = this.uniforms,
    imageMap = null,
    singlePass = null,
    direction = "horizontal"
  ) {
    super(name, vertCode, fragCode, attributes, uniforms);
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.inOutTexture = inOutTexture;
    this.map = imageMap;
    this.attributes = attributes;
    this.uniforms = uniforms;
    this.singlePass = singlePass;
    this.direction = direction;

    // set the direction of the blur
    if (this.direction === "horizontal") {
      this.uIsHorizontal = true;
    } else if (this.direction === "vertical") {
      this.uIsHorizontal = false;
    } else {
      console.error("Invalid direction for MultiPassShader: " + this.direction);
    }
    this.updateUniform("uIsHorizontal", "1i", this.uIsHorizontal);

    this.width = inOutTexture.width;
    this.height = inOutTexture.height;

    if (imageMap != null && imageMap != undefined) {
      // if imageMap was passed, use it to create the inOutTexture, else use the inOutTexture
      console.warn("Use passed imageData to create texture for " + name);
      this.inOutTexture = this.prepareImageTexture(
        "uSampler",
        imageMap,
        "inOutTexture",
        this.width,
        this.height,
        "LINEAR",
        "CLAMP_TO_EDGE",
        0
      );
      this.inOutTexture.width = imageMap.width;
      this.inOutTexture.height = imageMap.height;
    } else if (!this.inOutTexture) {
      // if no imageMap was passed, create a placeholder texture
      console.error(
        "No imageMap or inOutTexture provided to 2-pass shader" + name
      );
    }

    // create a temporary texture to render into
    this.intermediateTexture = this.prepareImageTexture(
      "uSampler",
      Utils.getPinkStartTexture(1200, 799),
      "intermediateTexture",
      this.width,
      this.height,
      "NEAREST",
      "CLAMP_TO_EDGE",
      0
    );

    this.prepareFramebufferObject(
      "horizontalBlurFBO",
      // target texture location: Texture rendered into
      { COLOR_ATTACHMENT0: this.intermediateTexture },
      this.width,
      this.height
    );
    this.prepareFramebufferObject(
      "verticalBlurFBO",
      // target texture location: Texture to rendered into
      { COLOR_ATTACHMENT0: this.inOutTexture },
      this.width,
      this.height
    );

    this.glContext.setShaderGlobal(this);
  }

  /* Render Cycle functions */
  swapBlurDirectionUniform() {
    // swap blur direction
    this.uIsHorizontal = !this.uIsHorizontal;
    this.updateUniform("uIsHorizontal", "1i", this.uIsHorizontal);
  }

  render = () => {
    const gl = this.gl;
    // render canvas texture
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    this.renderIntoTexture(this.inOutTexture, 0);
    // if single pass, return after first render
    if (!this.singlePass) {
      this.swapBlurDirectionUniform();
    }
    this.renderIntoTexture(this.intermediateTexture, 1);
  };
}
