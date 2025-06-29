/**
 * @file Attribute.js
 * @description This file defines the Attribute class, which represents a vertex attribute in a WebGL shader program.
 * @license MIT
 */
export class Attribute {
  /**
   * Creates a new Attribute instance.
   *
   * This class represents a vertex attribute in a WebGL shader program.
   * @param {string} name - Name of the attribute.
   * @param {number} location - Location of the attribute in the shader.
   * @param {number} size - Number of components per vertex attribute (1, 2, 3, or 4).
   * @param {string} type - Type of the attribute (e.g., "FLOAT", "INT").
   * @param {boolean} normalized - Whether the attribute is normalized.
   * @param {number} stride - Size of a single vertex in BYTES (this class handles the multiplication by BYTES).
   * @param {number} offset - Offset in BYTES to the first component of the attribute.
   * @param {Float32Array|ArrayBuffer} data - Data for the attribute.
   *
   */
  constructor(
    name,
    location,
    size,
    type,
    normalized,
    stride,
    offset,
    data,
    separate = false
  ) {
    this.name = name;
    this.location = location;
    this.size = size;
    this.type = type;
    this.normalized = normalized;
    this.stride = stride;
    this.offset = offset; // offset in bytes
    this.data = data;
    this.separate = separate; // whether this attribute is separate from the main buffer
  }
}
