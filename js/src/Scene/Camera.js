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
    far = 100,
    viewportWidth = null,
    viewportHeight = null
  ) {
    this.name = name;
    this.transform = transform || new Transform();
    this.target = target || [0, 0, 0]; // means the camera looks towards the negative Z-axis
    this.up = up || [0, 1, 0]; // Up direction of the camera, typically Y-axis
    this.fov = fov;
    /** @type {WebGLRenderingContext} */
    this.gl = GLContext.getInstance().gl;
    this.canvas = this.gl.canvas;
    this.viewportWidth = viewportWidth || this.canvas.width;
    this.viewportHeight = viewportHeight || this.canvas.height;
    this.aspectRatio = this.viewportWidth / this.viewportHeight;
    this.near = near;
    this.far = far;

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  // ...existing code...
  orbitAround(deltaX, deltaY, CoR, sensitivity = 0.5) {
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    const toRadian = (deg) => (deg * Math.PI) / 180;

    // Store yaw/pitch as properties for smooth orbit
    this._yaw = (this._yaw || 0) - deltaX * sensitivity;
    this._pitch = (this._pitch || 0) - deltaY * sensitivity;

    // Create yaw and pitch quaternions
    const yawQuat = quat.create();
    quat.setAxisAngle(yawQuat, [0, 1, 0], toRadian(this._yaw));

    const pitchQuat = quat.create();
    quat.setAxisAngle(pitchQuat, [1, 0, 0], toRadian(this._pitch));

    // Combine yaw and pitch
    const orbitQuat = quat.create();
    quat.multiply(orbitQuat, yawQuat, pitchQuat);

    // Set orientation in transform
    this.transform.setOrientation(orbitQuat);

    // Calculate offset from center (keep radius constant)
    const direction = vec3.create();
    vec3.subtract(direction, this.transform.translation, CoR);
    const radius = vec3.length(direction);

    // Start from a fixed offset (e.g., [0, 0, radius])
    const initialOffset = vec3.fromValues(0, 0, radius);

    // Rotate offset by orientation quaternion
    const rotatedOffset = vec3.create();
    vec3.transformQuat(rotatedOffset, initialOffset, orbitQuat);

    // Update camera position
    vec3.add(this.transform.translation, CoR, rotatedOffset);

    this.transform.updateMatrix();
  }
  // ...existing code...

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
    const aspect = this.viewportWidth / this.viewportHeight;
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
