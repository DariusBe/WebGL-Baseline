import { GLContext } from "../GL/GLContext.js";
import { Transform } from "./Transform.js";
import { UUID } from "../Utils/UUID.js";
import "../../../gl-matrix-min.js";

export class Camera {
  constructor(name = "Camera") {
    this.name = name;
    this.transform = new Transform();
    this.target = [0, 0, -1];
    this.up = [0, 1, 0];
    this.fov = 45; // Field of view in degrees
    this.aspectRatio = 1; // Width / Height
    this.near = 0.1; // Near clipping plane
    this.far = 100; // Far clipping plane
    this._uuid = UUID.generate();
  }

  getViewMatrix() {
    const mat4 = glMatrix.mat4;
    const position = this.transform.getTranslation();
    return mat4.lookAt(mat4.create(), position, this.target, this.up);
  }

  getProjectionMatrix() {
    const toRadian = (degrees) => {
      return (degrees * Math.PI) / 180;
    };

    const mat4 = glMatrix.mat4;
    return mat4.perspective(
      mat4.create(),
      toRadian(this.fov),
      this.aspectRatio,
      this.near,
      this.far
    );
  }
}
