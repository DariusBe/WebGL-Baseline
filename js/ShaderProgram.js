import { GLContext } from "./GLContext.js";

const glsl = (x) => x;

var vertCode = glsl`#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aColor;

uniform mat4 uModel;

// std140
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
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
uniform mat4 uModel;

// uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
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
    fragColor = vec4(vColor+(tex.rgb), 1.0);
}`;

export class ShaderProgram {
  constructor(
    vertexShaderSource = vertCode,
    fragmentShaderSource = fragCode,
    name = "newShaderProgram"
  ) {
    this.name = name;
    this.init(vertexShaderSource, fragmentShaderSource);
    this.uniformData = new Map();
  }

  /**
   * Prepares the shader program
   * @param {string} vertexShaderCode
   * @param {string} fragmentShaderCode
   * @param {*} tf_description
   * @returns
   */
  init(
    vertexShaderCode = vertCode,
    fragmentShaderCode = fragCode,
    tf_description = null
  ) {
    const gl = GLContext.getInstance().gl;
    const verbosityLevel = GLContext.getInstance().verbosityLevel;

    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    this.vertexShader.name = this.name + "VertShader";
    gl.shaderSource(this.vertexShader, vertexShaderCode);
    gl.compileShader(this.vertexShader);
    if (
      verbosityLevel > 0 &&
      !gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)
    ) {
      console.error(
        "Error compiling ",
        this.vertexShader.name,
        gl.getShaderInfoLog(this.vertexShader)
      );
      return;
    }

    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    this.fragmentShader.name = this.name + "FragShader";
    gl.shaderSource(this.fragmentShader, fragmentShaderCode);
    gl.compileShader(this.fragmentShader);
    if (
      verbosityLevel > 0 &&
      !gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)
    ) {
      console.error(
        "Error compiling ",
        this.fragmentShader.name,
        gl.getShaderInfoLog(this.fragmentShader)
      );
      return;
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);

    // before linking, set up transform feedback varyings if enabled
    if (tf_description !== null) {
      const { TF_attribute, TF_varyings, TF_mode, TF_bufferSize } =
        tf_description;
      this.tfBufferSize = TF_bufferSize;
      if (verbosityLevel >= 3) {
        console.info(
          "Transform feedback enabled with varyings:",
          TF_varyings,
          "for attributes:",
          TF_attribute,
          "buffer size:",
          TF_bufferSize
        );
      }
      /* TF_mode: SEPARATE_ATTRIBS or INTERLEAVED_ATTRIBS:
       * SEPARATE_ATTRIBS: If multiple varyings are passed, each varying is written to a separate buffer object.
       * INTERLEAVED_ATTRIBS: All varyings are written to the same buffer object.
       */
      gl.transformFeedbackVaryings(this.program, TF_varyings, TF_mode);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.tfBuffer);
    }

    gl.linkProgram(this.program);
    if (
      verbosityLevel > 0 &&
      !gl.getProgramParameter(this.program, gl.LINK_STATUS)
    ) {
      console.error(
        "Error linking program",
        gl.getProgramInfoLog(this.program)
      );
      return;
    }
    this.setShaderGlobal();
  }

  use = () => {
    const gl = GLContext.getInstance().gl;
    gl.useProgram(this.program);
  };

  setShaderGlobal = () => {
    const glContext = GLContext.getInstance();
    glContext.setShaderGlobal(this);
  };
}
