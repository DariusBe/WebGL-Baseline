import { GLContext } from "../GL/GLContext.js";
import { Uniform } from "../GL/Uniform.js";
import { Texture } from "./Texture.js";
import { ShaderProgram } from "../GL/ShaderProgram.js";
import { Utils } from "../Utils/Utils.js";
import { UUID } from "../Utils/UUID.js";
import "../../../gl-matrix-min.js";

export class Material {
  constructor(
    name = "new Material",
    shaderProgram,
    uniformData = null,
    texture = null
  ) {
    this.name = name;
    this.shaderProgram = shaderProgram;
    this.uniformData = uniformData; // Map of uniform names to Uniform objects
    this.texture = texture;

    const gl = GLContext.getInstance().gl;
    if (this.shaderProgram == null) {
      console.info("No shader program provided, creating a default one.");
      this.shaderProgram = new ShaderProgram();
      console.info(
        this.shaderProgram.program,
        "created for material:",
        this.name
      );
    }
    if (this.uniformData == null) {
      this.uniformData = new Map();
    }
    if (this.texture && this.texture instanceof Texture) {
      this.texture.bindTexture();
    }

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  setTexture(texture, unit = 0, uniformName = "uSampler") {
    const gl = GLContext.getInstance().gl;
    if (this.getUniformLocation(uniformName) === null) {
      console.warn(
        `Uniform ${uniformName} not found in program ${this.shaderProgram.program}`
      );
    }
    this.setUniform(new Uniform(uniformName, "1i", unit));

    if (texture !== null && texture instanceof Texture) {
      this.texture = texture;
      // this.texture.bindTexture(unit);
    }
  }

  bindTexture(unit = 0) {
    if (this.texture instanceof Texture && unit !== null) {
      this.texture.bindTexture(unit);
    } else if (unit === null) {
      this.texture.unbindTexture();
    } else {
      console.warn("No texture to bind for material:", this.name);
    }
  }

  unbindTexture() {
    this.texture.unbindTexture();
  }

  /**
   * Prepares the uniforms for the shader program
   * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
   * @param {boolean} verbose if true, success message is printed
   * @returns {void}
   */
  setUniform = (uniform) => {
    const gl = GLContext.getInstance().gl;
    const program = this.shaderProgram.program;

    gl.useProgram(program);

    if (uniform === null || uniform === undefined) return;

    const uniformLocation = gl.getUniformLocation(program, uniform.name);
    if (uniformLocation === null) {
      return;
    }
    if (uniform.type === "bool") {
      gl.uniform1i(uniformLocation, uniform.value);
    } else if (uniform.type === "1i" || uniform.type === "int") {
      // integer
      gl.uniform1i(uniformLocation, uniform.value);
    } else if (uniform.type === "1iv") {
      // integer array
      gl.uniform1iv(uniformLocation, uniform.value);
    } else if (uniform.type === "2iv") {
      // vec2 integer array
      gl.uniform2iv(uniformLocation, uniform.value);
    } else if (uniform.type === "3iv") {
      // vec3 integer array
      gl.uniform3iv(uniformLocation, uniform.value);
    } else if (uniform.type === "4iv") {
      // vec4 integer array
      gl.uniform4iv(uniformLocation, uniform.value);
    } else if (uniform.type === "1ui") {
      // unsigned integer
      gl.uniform1ui(uniformLocation, uniform.value);
    } else if (uniform.type === "1f") {
      gl.uniform1f(uniformLocation, uniform.value);
    } else if (uniform.type === "1fv") {
      // float array
      gl.uniform1fv(uniformLocation, uniform.value);
    } else if (uniform.type === "2fv") {
      // vec2 array
      gl.uniform2fv(uniformLocation, uniform.value);
    } else if (uniform.type === "3fv") {
      // vec3 array
      gl.uniform3fv(uniformLocation, uniform.value);
    } else if (uniform.type === "4fv") {
      // vec4 array
      gl.uniform4fv(uniformLocation, uniform.value);
    } else if (uniform.type === "1i") {
      // integer
      gl.uniform1i(uniformLocation, uniform.value);
    } else if (uniform.type === "1iv") {
      // integer array
      gl.uniform1iv(uniformLocation, uniform.value);
    } else if (uniform.type === "2iv") {
      // vec2 integer array
      gl.uniform2iv(uniformLocation, uniform.value);
    } else if (uniform.type === "3iv") {
      // vec3 integer array
      gl.uniform3iv(uniformLocation, uniform.value);
    } else if (uniform.type === "4iv") {
      // vec4 integer array
      gl.uniform4iv(uniformLocation, uniform.value);
    } else if (uniform.type === "mat2") {
      // mat2
      gl.uniformMatrix2fv(uniformLocation, false, uniform.value);
    } else if (uniform.type === "mat3") {
      // mat3
      gl.uniformMatrix3fv(uniformLocation, false, uniform.value);
    } else if (uniform.type === "mat4") {
      // mat4
      gl.uniformMatrix4fv(uniformLocation, false, uniform.value);
    } else {
      console.error("Unknown uniform type:", uniform.type);
    }
    this.uniformData[uniform.name] = {
      type: uniform.type,
      value: uniform.value,
      location: uniformLocation,
    };
  };

  getUniformLocation(name) {
    const gl = GLContext.getInstance().gl;
    const program = this.shaderProgram.program;
    gl.useProgram(program);
    const uniformLocation = gl.getUniformLocation(program, name);
    if (uniformLocation === null) {
      console.warn(
        `Uniform ${name} not found in program ${this.shaderProgram.name}`
      );
      return null;
    }
    return uniformLocation;
  }

  // infer all active uniforms from the shader program
  getActiveUniforms() {
    const gl = GLContext.getInstance().gl;
    const program = this.shaderProgram.program;
    const list = [];
    gl.useProgram(program);
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const uniformInfo = gl.getActiveUniform(program, i);
      if (uniformInfo) {
        const uniformName = uniformInfo.name;
        const uniformType = uniformInfo.type;
        const uniformLocation = gl.getUniformLocation(program, uniformName);
        if (uniformLocation !== null) {
          let type;
          switch (uniformType) {
            case gl.FLOAT:
              type = "1f";
              break;
            case gl.FLOAT_VEC2:
              type = "2fv";
              break;
            case gl.FLOAT_VEC3:
              type = "3fv";
              break;
            case gl.FLOAT_VEC4:
              type = "4fv";
              break;
            case gl.INT:
              type = "1i";
              break;
            case gl.INT_VEC2:
              type = "2iv";
              break;
            case gl.INT_VEC3:
              type = "3iv";
              break;
            case gl.INT_VEC4:
              type = "4iv";
              break;
            case gl.BOOL:
              type = "bool";
              break;
            case gl.SAMPLER_2D:
              type = "1i"; // Texture samplers are usually integers
              break;
            case gl.SAMPLER_CUBE:
              type = "1i"; // Texture samplers are usually integers
              break;
            case gl.MAT2:
              type = "mat2";
              break;
            case gl.MAT3:
              type = "mat3";
              break;
            case gl.MAT4:
              type = "mat4";
              break;
            default:
              console.warn(
                `Unknown uniform type: ${uniformType} for uniform ${uniformName}`
              );
              continue;
          }
          // get value at the uniform location
          const uniformValue = gl.getUniform(program, uniformLocation);
          list.push({
            name: uniformName,
            type: type,
            location: uniformLocation,
            value: uniformValue,
          });
        }
      }
    }
    return list;
  }

  use() {
    const gl = GLContext.getInstance().gl;
    gl.useProgram(this.shaderProgram.program);
  }

  equals = (other) => {
    return other instanceof Material && this.getUUID() === other.getUUID();
  };
}
