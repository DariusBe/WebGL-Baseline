import { GLContext } from "../GL/GLContext.js";
import { Attribute } from "../GL/Attribute.js";
import { UUID } from "../Utils/UUID.js";

export class VAO {
  constructor(name, attributes = [], drawMode = "STATIC_DRAW") {
    this.name = name || `VAO ${performance.now()}`;
    this.vao = null;
    this.buffer = null;
    this.attributes = attributes || new Map();
    this.drawMode = drawMode;
    this._uuid = UUID.generate();
    this.init();
  }

  init() {
    const gl = GLContext.getInstance().gl;
    this.vao = gl.createVertexArray();
    this.buffer = gl.createBuffer();
    if (!this.vao) {
      console.error("Failed to create VAO");
      return;
    }

    gl.bindVertexArray(this.vao);

    for (const attribute of this.attributes.values()) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attribute.data, gl[this.drawMode]);
      // args for bufferSubData: target, offset, data
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, attribute.data);

      if (gl.getError() !== gl.NO_ERROR) {
        console.error(
          `Error enabling Vertex Attribute ${attribute.name} at location ${attribute.location}`
        );
      }

      gl.vertexAttribPointer(
        attribute.location,
        attribute.size,
        gl[attribute.type],
        attribute.normalized,
        attribute.stride,
        attribute.offset
      );
      gl.enableVertexAttribArray(attribute.location);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  bind() {
    const gl = GLContext.getInstance().gl;
    if (!this.vao) {
      console.error("VAO is not initialized");
      return;
    }
    gl.bindVertexArray(this.vao);
  }

  getBufferContent() {
    const gl = GLContext.getInstance().gl;
    if (!this.buffer) {
      console.error("Buffer is not initialized");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // extract data from the buffer
    const size = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
    if (size === 0) {
      console.error("Buffer is empty");
      return null;
    }
    const data = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, data);
    // check if data is null or undefined
    if (data === undefined || data === null) {
      console.error("Failed to get buffer content");
      return null;
    }
    if (data === null) {
      console.error("Failed to get buffer content");
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return data;
  }

  equals(other) {
    if (!(other instanceof VAO)) return false;
    return this._uuid === other._uuid;
  }
}
