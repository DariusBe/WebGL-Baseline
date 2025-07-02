import { GLContext } from "./GLContext.js";
import { Attribute } from "./Attribute.js";
import { Utils } from "./Utils.js";
import "../../gl-matrix-min.js";

export class Geometry {
  vao = null;
  AttributesPoolBuffer = null; // Buffer for attributes that are not separate
  attributeList = {}; // List of attributes with their locations and properties

  /**
   * Creates a new Geometry instance.
   *
   * This class represents a WebGL Vertex Array Object (VAO) that contains vertex attributes and optionally an index buffer.
   * @param {WebGLBuffer} vertexBuffer - The buffer containing vertex data.
   * @param {Array<Attribute>} attributes - An array of Attribute objects defining the vertex attributes.
   * @param {WebGLBuffer} indexBuffer - Optional buffer containing indices for indexed drawing.
   */
  constructor(attributes = null, indexBuffer = null) {
    const gl = GLContext.getInstance().gl;
    this.vao = gl.createVertexArray();

    if (attributes == null) {
      console.info(
        "No attributes provided for Geometry. Using default attributes."
      );
      const defaultAttributes = [
        new Attribute(
          "aPosition",
          0,
          3,
          "FLOAT",
          false,
          11 * 4, // 11 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color)
          0, // Offset for position
          Utils.canvasAttribsWithNormals
        ),
        new Attribute(
          "aTexCoord",
          1,
          2,
          "FLOAT",
          false,
          11 * 4, // 11 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color)
          3 * 4, // Offset for texture coordinates
          Utils.canvasAttribsWithNormals
        ),
        new Attribute(
          "aNormal",
          2,
          3,
          "FLOAT",
          false,
          11 * 4, // 11 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color)
          5 * 4, // Offset for normal
          Utils.canvasAttribsWithNormals
        ),
        new Attribute(
          "aColor",
          3,
          3,
          "FLOAT",
          false,
          11 * 4, // 11 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color)
          8 * 4, // Offset for color
          Utils.canvasAttribsWithNormals
        ),
      ];

      this.prepareAttributes(defaultAttributes, false);
    }

    // index is the buffer that contains the indices of the vertices
    if (indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }

    gl.bindVertexArray(null);
  }

  init(attributes, indexBuffer) {
    const gl = GLContext.getInstance().gl;
    gl.bindVertexArray(this.vao);
    console.log("Binding vertex buffer:", attributes);
  }

  bind(gl) {
    gl.bindVertexArray(this.vao);
  }

  /* Prepare vertex attributes for the geometry.
   * @param {Array<Attribute>} attributes - The attributes to prepare.
   */
  prepareAttributes = (attributes) => {
    const gl = GLContext.getInstance().gl;

    gl.bindVertexArray(this.vao);

    this.AttributesPoolBuffer = gl.createBuffer();
    this.AttributesPoolBuffer.name = "AttributesPool_Buffer";

    for (const attribute of attributes) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.AttributesPoolBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, attribute.data, gl.DYNAMIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, attribute.data);
      gl.enableVertexAttribArray(attribute.location);

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
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  };
}
