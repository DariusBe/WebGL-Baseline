import "../../../gl-matrix-min.js";

export class Transform {
  /**
   * Creates a new Transform instance.
   * @param {Array<number>} translate - The translation vector [x, y, z].
   * @param {Array<number>} rotate - The rotation vector [x, y, z] in radians.
   * @param {Array<number>} scale - The scaling vector [x, y, z].
   */
  constructor(translate = [0, 0, 0], rotate = [0, 0, 0], scale = [1, 1, 1]) {
    this.translation = translate; // [x, y, z]
    this.rotation = rotate; // Euler angles in radians
    this.scale = scale; // [x, y, z]
    this.matrix = glMatrix.mat4.create();
    this.updateMatrix();
  }

  /**
   * Updates the transformation matrix based on the current translation, rotation, and scale.
   * This method computes the transformation matrix by combining translation, rotation, and scaling.
   * It uses the glMatrix library to create and multiply the matrices.
   * The resulting matrix is stored in this.matrix.
   */
  updateMatrix() {
    const mat4 = glMatrix.mat4;
    const translationMatrix = mat4.create();
    // Set the translation matrix to the current translation
    mat4.translate(translationMatrix, translationMatrix, this.translation);
    const rotationMatrix = mat4.create();
    mat4.rotateX(rotationMatrix, rotationMatrix, this.rotation[0]);
    mat4.rotateY(rotationMatrix, rotationMatrix, this.rotation[1]);
    mat4.rotateZ(rotationMatrix, rotationMatrix, this.rotation[2]);
    const scaleMatrix = mat4.create();
    mat4.scale(scaleMatrix, scaleMatrix, this.scale);
    mat4.multiply(this.matrix, translationMatrix, rotationMatrix);
    mat4.multiply(this.matrix, this.matrix, scaleMatrix);
  }

  /**
   * Translates the transform by the given offsets.
   * @param {number} x - The x offset.
   * @param {number} y - The y offset.
   * @param {number} z - The z offset.
   */
  translate(x, y, z) {
    this.translation[0] += x;
    this.translation[1] += y;
    this.translation[2] += z;
    this.updateMatrix();
  }

  /**
   * Sets the translation to the specified values.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @param {number} z - The z coordinate.
   */
  setTranslation(x, y, z) {
    this.translation = [x, y, z];
    this.updateMatrix();
  }

  /**
   * Rotates the transform by the given angles in radians.
   * @param {number} x - The rotation around the x-axis in radians.
   * @param {number} y - The rotation around the y-axis in radians.
   * @param {number} z - The rotation around the z-axis in radians.
   */
  rotate(x, y, z) {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.updateMatrix();
  }

  /**
   * Sets the rotation to the specified values.
   * @param {number} x - The rotation around the x-axis in radians.
   * @param {number} y - The rotation around the y-axis in radians.
   * @param {number} z - The rotation around the z-axis in radians.
   */
  setRotation(x, y, z) {
    this.rotation = [x, y, z];
    this.updateMatrix();
  }

  /**
   * Scales the transform by the given factors.
   * @param {number} x - The scale factor along the x-axis.
   * @param {number} y - The scale factor along the y-axis.
   * @param {number} z - The scale factor along the z-axis.
   */
  scaleBy(x, y, z) {
    this.scale[0] *= x;
    this.scale[1] *= y;
    this.scale[2] *= z;
    this.updateMatrix();
  }

  /**
   * Sets the scale to the specified values.
   * @param {number} x - The scale factor along the x-axis.
   * @param {number} y - The scale factor along the y-axis.
   * @param {number} z - The scale factor along the z-axis.
   */
  setScale(x, y, z) {
    this.scale = [x, y, z];
    this.updateMatrix();
  }

  /**
   * Returns the transformation matrix.
   * @returns {Float32Array} The transformation matrix.
   */
  getMatrix() {
    return this.matrix;
  }

  /**
   * Returns the translation, rotation, and scale vectors.
   * @returns {Object} An object containing translation, rotation, and scale vectors.
   */
  getTranslation() {
    return this.translation;
  }

  /**
   * Returns the rotation vector.
   * @returns {Array<number>} The rotation vector [x, y, z] in radians.
   */
  getRotation() {
    return this.rotation;
  }

  /**
   * Returns the scale vector.
   * @returns {Array<number>} The scale vector [x, y, z].
   */
  getScale() {
    return this.scale;
  }

  /**
   * Creates a copy of the Transform instance.
   * @returns {Transform} A new Transform instance with the same translation, rotation, and scale.
   */
  copy() {
    return new Transform(
      [...this.translation],
      [...this.rotation],
      [...this.scale]
    );
  }
}
