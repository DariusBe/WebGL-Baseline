import "../../gl-matrix-min.js";

export class Transform {
  constructor(translate = [0, 0, 0], rotate = [0, 0, 0], scale = [1, 1, 1]) {
    this.translation = [0, 0, 0];
    this.rotation = [0, 0, 0]; // Euler angles in radians
    this.scale = [1, 1, 1];
    this.matrix = glMatrix.mat4.create();
    this.updateMatrix();
  }

  updateMatrix() {
    const mat4 = glMatrix.mat4;
    const translationMatrix = mat4.create();
    // Set the translation matrix to the current translation
    // mat4.identity(translationMatrix);
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
  translate(x, y, z) {
    this.translation[0] += x;
    this.translation[1] += y;
    this.translation[2] += z;
    this.updateMatrix();
  }

  rotate(x, y, z) {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.updateMatrix();
  }

  scaleBy(x, y, z) {
    this.scale[0] *= x;
    this.scale[1] *= y;
    this.scale[2] *= z;
    this.updateMatrix();
  }

  setTranslation(x, y, z) {
    this.translation = [x, y, z];
    this.updateMatrix();
  }

  setRotation(x, y, z) {
    this.rotation = [x, y, z];
    this.updateMatrix();
  }

  setScale(x, y, z) {
    this.scale = [x, y, z];
    this.updateMatrix();
  }

  getMatrix() {
    return this.matrix;
  }
  getTranslation() {
    return this.translation;
  }

  getRotation() {
    return this.rotation;
  }

  getScale() {
    return this.scale;
  }
}
