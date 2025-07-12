import { GLContext } from "../GL/GLContext.js";
import { Transform } from "./Transform.js";
import { UUID } from "../Utils/UUID.js";
import "../../../gl-matrix-min.js";

export class Camera {
  constructor(
    name = "Camera",
    transform = null,
    target = null,
    up = null,
    fov = 45,
    aspectRatio = 1,
    near = 0.1,
    far = 100
  ) {
    this.name = name;
    this.transform = transform || new Transform();
    this.target = target || [0, 0, 1]; // means the camera looks towards the negative Z-axis
    this.up = up || [0, 1, 0]; // Up direction of the camera, typically Y-axis
    this.fov = fov;
    this.aspectRatio = aspectRatio;
    this.near = near;
    this.far = far;

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
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

  equals = (other) => {
    return other instanceof Camera && this.getUUID() === other.getUUID();
  };
}
