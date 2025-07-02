import { GLContext } from "./GLContext.js";
import { Uniform } from "./Uniform.js";
import { Texture } from "./Texture.js";
import { ShaderProgram } from "./ShaderProgram.js";
import { Utils } from "./Utils.js";
import "../../gl-matrix-min.js";

export class Material {
  constructor(name = "new Material", shaderProgram, uniformData = null) {
    this.name = name;
    this.shaderProgram = shaderProgram;
    this.uniformData = uniformData; // Map of uniform names to Uniform objects

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

    const tex = new Texture(
      "defaultTexture",
      Utils.getPinkStartTexture(512, 512),
      512,
      512,
      "RGBA16F",
      "LINEAR",
      "RGBA",
      "FLOAT",
      "CLAMP_TO_EDGE"
    );
    this.setUniform(new Uniform("uSampler", "1i", 0, tex.webGLTexture));
    this.setUniform(new Uniform("uModel", "mat4", glMatrix.mat4.create()));
  }

  /**
   * Prepares the uniforms for the shader program
   * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
   * @param {boolean} verbose if true, success message is printed
   * @returns {void}
   */
  setUniform = (uniform) => {
    const gl = GLContext.getInstance().gl;
    console.info(
      "Setting uniform:",
      uniform.name,
      "to:",
      uniform.value,
      "for program:",
      this.shaderProgram
    );
    const program = this.shaderProgram.program;

    gl.useProgram(program);

    if (uniform === null || uniform === undefined) return;

    const uniformLocation = gl.getUniformLocation(program, uniform.name);
    if (uniformLocation === null) {
      return;
    }
    if (uniform.type === "bool") {
      gl.uniform1i(uniformLocation, uniform.value);
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
      console.info("Setting mat4 uniform:", uniform.name, uniform.value);
      gl.uniformMatrix4fv(uniformLocation, false, uniform.value);
    } else {
      console.error("Unknown uniform type:", uniform.type);
    }
  };

  attach() {
    const gl = GLContext.getInstance().gl;
    gl.useProgram(this.shaderProgram.program);
    for (let name in this.uniformData)
      console.log("Uniform", name, ":", this.uniformData[name].value);
  }
}
