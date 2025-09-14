import "../../../gl-matrix-min.js";
import { UUID } from "../Utils/UUID.js";
import { ShaderProgram } from "./ShaderProgram.js";
import { Uniform } from "./Uniform.js";

export class UniformBuffer {
  constructor(bindingIndex, name, chunks) {
    this.bindingIndex = bindingIndex;
    this.name = name;
    this.chunks = chunks; // each of 4 floats
    this._size = this.chunks.length * 4;

    this.init();
    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  /*
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
  */

  typeSizes = {
    mat4: 16, // exactly 4 chunks
    mat3: 16, // needs alignment to 3-float+1padding per chunk
    mat2: 16, // needs alignment to 2-float+2padding per chunk
    vec4: 4, // exactly one chunk
    vec3: 3, // needs alignment to 3-float+1padding to fill chunk
    vec2: 2, // needs alignment to 2-float+2padding to fill chunk
    float: 1,
    int: 1,
    bool: 1,
    pad: 1,
  };

  init() {
    // console.error(this._size);
  }

  insertUniform(uniform) {}

  /**
   *
   * @param {ShaderProgram} shader - the shader to get the global uniform block
   * @returns {object|null} - returns an object with blockIndex, blockSize, and blockBinding or null if not found
   */
  getBlockLocation = (shader) => {
    const gl = this.gl;
    const blockIndex = gl.getUniformBlockIndex(shader.program, this.name);
    if (blockIndex === -1) {
      console.error(
        `Uniform block ${this.name} not found in shader`,
        shader.name
      );
      return null;
    }
    const blockSize = gl.getActiveUniformBlockParameter(
      shader.program,
      blockIndex,
      gl.UNIFORM_BLOCK_DATA_SIZE
    );
    if (blockSize === -1) {
      console.error(
        `Uniform block ${this.name} has no data size in shader`,
        shader.name
      );
      return null;
    }
    const blockBinding = gl.getUniformBlockParameter(
      shader.program,
      blockIndex,
      gl.UNIFORM_BLOCK_BINDING
    );
    if (blockBinding === -1) {
      console.error(
        `Uniform block ${this.name} has no binding in shader`,
        shader.name
      );
      return null;
    }
    console.log(
      `Uniform block ${this.name} in shader`,
      shader.name,
      "has size",
      blockSize,
      "and binding",
      blockBinding
    );
    return {
      blockIndex,
      blockSize,
      blockBinding,
    };
  };

  /* 
  prepare() {
    0) define binding point
    const LIGHT_BINDING_POINT = 0;

    1) connect each unform block & buffer with binding point no.
    for each block in every program:
    // request uniform block reference:
    // (with 'blockName' from shader)
    const ref = gl.getUnformBlockIndex(program, blockName) 

    gl.uniformBlockBinding(
        program,
        ref,
        BINDING_POINT_NUMBER
    )

     2) associate data with binding point no.:
     const lightBuffer = gl.createBuffer();
     
     // bind buffer to binding point
     gl.bindBufferBase(
        gl.UNIFORM_BUFFER,
        BINDING_POINT_NUMBER,
        data_buffer
     )
    // populate buffer
    gl.bufferData(
        gl.UNIFORM_BUFFER,
        lightData.byteLength,
        gl.DYNAMIC_DRAW
    )
    
  }
  */
}
