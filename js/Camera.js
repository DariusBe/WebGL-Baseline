import { GLContext } from "./GLContext.js";
import { Transform } from "./Transform.js";
import "../../gl-matrix-min.js";

export class Camera {
  constructor() {
    this.transform = new Transform();
    this.target = [0, 0, -1];
    this.up = [0, 1, 0];
    this.fov = 45; // Field of view in degrees
    this.aspectRatio = 1; // Width / Height
    this.near = 0.1; // Near clipping plane
    this.far = 100; // Far clipping plane
  }

  getViewMatrix() {
    // Implement view matrix calculation here
    return mat4.lookAt(mat4.create(), this.position, this.target, this.up);
  }

  getProjectionMatrix() {
    // Implement projection matrix calculation here
    return mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(this.fov),
      this.aspectRatio,
      this.near,
      this.far
    );
  }
}
