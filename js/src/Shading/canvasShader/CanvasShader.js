import { GLContext } from "../../GL/GLContext.js";
import { LegacyShader } from "../LegacyShader.js";
import { Utils } from "../../Utils/Utils.js";
import { ModelOBJ } from "../../Geom/ModelOBJ.js";
import { ShaderProgram } from "../../GL/ShaderProgram.js";
import "../../../../gl-matrix-min.js";
const glsl = (x) => x;

var vertCode = glsl`#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aColor;
// std140
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
out vec3 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vColor;

void main() {
    vPosition = aPosition;
    vTexCoord = aTexCoord;
    vNormal = aNormal;
    vColor = aColor;

    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

var fragCode = glsl`#version 300 es
precision highp float;

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vColor;

uniform sampler2D uSampler;

// uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

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

void main() {
    // vec4 cursor = prepareCursor(25.0, vec4(0.4471, 0.4471, 0.4471, 0.5));

    vec4 tex = texture(uSampler, vTexCoord);
    fragColor = vec4(tex);
}`;

export class CanvasShader extends LegacyShader {
  name = "CanvasShader";
  texture = null;
  imageMap = null;
  attributes = null;
  uniforms = null;

  constructor(
    name = this.name,
    attributes = this.attributes,
    uniforms = this.uniforms,
    imageMap
  ) {
    super(name, vertCode, fragCode, attributes, uniforms);
    this.glContext = GLContext.getInstance();
    this.gl = this.glContext.gl;
    this.imageMap = imageMap;
    this.attributes = attributes;
    this.uniforms = uniforms;

    if (imageMap === null || imageMap === undefined) {
      console.warn(
        "No map provided to",
        name,
        ", generating placeholder texture."
      );
      imageMap = Utils.getPinkStartTexture(512, 512);
      imageMap.width = 512;
      imageMap.height = 512;
    } else {
      console.log(
        "Using provided imageMap for",
        name,
        "of size",
        imageMap.width,
        "x",
        imageMap.height
      );
    }
    this.texture = this.prepareImageTexture(
      "uSampler",
      imageMap,
      "canvasTex",
      imageMap.width,
      imageMap.height,
      "NEAREST",
      "CLAMP_TO_EDGE",
      0
    );
    this.glContext.setShaderGlobal(this);
  }

  render = (
    drawArrays = () => this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4)
  ) => {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    drawArrays();
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };
}

// // inherit from Shader class
// export class CanvasShader extends LegacyShader {
//   name = "CanvasShader";
//   texture = null;
//   imageMap = null;
//   attributes = null;
//   uniforms = null;

//   constructor(
//     name = this.name,
//     attributes = this.attributes,
//     uniforms = this.uniforms,
//     imageMap
//   ) {
//     super(name, vertCode, fragCode, attributes, uniforms);
//     this.glContext = GLContext.getInstance();
//     this.gl = this.glContext.gl;
//     this.imageMap = imageMap;
//     this.attributes = attributes;
//     this.uniforms = uniforms;

//     if (imageMap === null || imageMap === undefined) {
//       console.warn(
//         "No map provided to",
//         name,
//         ", generating placeholder texture."
//       );
//       imageMap = Utils.getPinkStartTexture(512, 512);
//       imageMap.width = 512;
//       imageMap.height = 512;
//     } else {
//       console.log(
//         "Using provided imageMap for",
//         name,
//         "of size",
//         imageMap.width,
//         "x",
//         imageMap.height
//       );
//     }
//     this.texture = this.prepareImageTexture(
//       "uSampler",
//       imageMap,
//       "canvasTex",
//       imageMap.width,
//       imageMap.height,
//       "NEAREST",
//       "CLAMP_TO_EDGE",
//       0
//     );
//     this.glContext.setShaderGlobal(this);
//   }

//   render = (
//     drawArrays = () => this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4)
//   ) => {
//     const gl = this.gl;
//     gl.useProgram(this.program);
//     gl.bindVertexArray(this.vao);

//     gl.activeTexture(gl.TEXTURE0);
//     gl.bindTexture(gl.TEXTURE_2D, this.texture);
//     drawArrays();
//     gl.bindVertexArray(null);
//     gl.bindTexture(gl.TEXTURE_2D, null);
//   };
// }
