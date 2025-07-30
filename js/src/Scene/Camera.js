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
    near = 0.1,
    far = 100
  ) {
    this.name = name;
    this.transform = transform || new Transform();
    this.target = target || [0, 0, 0]; // means the camera looks towards the negative Z-axis
    this.up = up || [0, 1, 0]; // Up direction of the camera, typically Y-axis
    this.fov = fov;
    /** @type {WebGLRenderingContext} */
    this.gl = GLContext.getInstance().gl;
    this.canvas = this.gl.canvas;
    this.aspectRatio = this.canvas.width / this.canvas.height;
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
    // to get a straight view matrix, we need to look where its rotation is pointing
    const rotation = this.transform.getRotation();

    return mat4.lookAt(mat4.create(), position, rotation, this.up);
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

  updateProjectionMatrix() {
    const gl = this.gl;
    const mat4 = glMatrix.mat4;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 0.1;
    const far = 1000.0;

    // Convert FOV from degrees to radians if needed
    const fovRadians = this.fov * (Math.PI / 180);

    mat4.perspective(this.getProjectionMatrix(), fovRadians, aspect, near, far);
  }

  equals = (other) => {
    return other instanceof Camera && this.getUUID() === other.getUUID();
  };
}
