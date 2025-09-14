import { GLContext } from "../GL/GLContext.js";
import { Transform } from "../Geom/Transform.js";
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
    // For orbit controls
    this.pitch = 0; // think "airplane rising nose"
    this.yaw = 0; // think "airplane turning left/right"
    // roll would be "airplane doing barrel roll"

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.orientation = {
      top: [0, 1, 0],
      bottom: [0, -1, 0],
      left: [-1, 0, 0],
      right: [1, 0, 0],
      front: [0, 0, -1],
      back: [0, 0, 1],
    };
  }

  setAspect(aspect) {
    this.aspectRatio = aspect;
    this.updateProjectionMatrix();
  }

  zoom(delta, sensitivity = 0.1) {
    const vec3 = glMatrix.vec3;
    const direction = vec3.create();
    vec3.subtract(direction, this.target, this.transform.getTranslation());
    vec3.normalize(direction, direction);

    const zoomAmount = delta * sensitivity;
    const newPosition = vec3.create();
    // Move the camera along its viewing direction
    vec3.scaleAndAdd(
      newPosition,
      this.transform.getTranslation(),
      direction,
      zoomAmount
    );

    // apply the new position
    this.transform.setTranslation(
      newPosition[0],
      newPosition[1],
      newPosition[2]
    );
    // Update the transform matrix
    this.transform.updateMatrix();
  }

  orbitTo(orientation, CoR, distance = 5) {
    this.orbitAround(0, 0, CoR); // Reset any previous orbiting offsets

    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    const toRadian = (deg) => (deg * Math.PI) / 180;

    let targetDirection;
    switch (orientation) {
      case "top":
        targetDirection = this.orientation.top;
        break;
      case "bottom":
        targetDirection = this.orientation.bottom;
        break;
      case "left":
        targetDirection = this.orientation.left;
        break;
      case "right":
        targetDirection = this.orientation.right;
        break;
      case "front":
        targetDirection = this.orientation.front;
        break;
      case "back":
        targetDirection = this.orientation.back;
        break;
      default:
        console.warn(`Unknown orientation: ${orientation}`);
        return;
    }

    // Calculate the new camera position
    const newPosition = vec3.create();
    vec3.scaleAndAdd(newPosition, CoR, targetDirection, distance);
    this.transform.setTranslation(
      newPosition[0],
      newPosition[1],
      newPosition[2]
    );

    // Calculate the orientation quaternion to look at the center of rotation
    const lookAtMatrix = glMatrix.mat4.create();
    glMatrix.mat4.targetTo(lookAtMatrix, newPosition, CoR, this.up);
    const orientationQuat = glMatrix.quat.create();
    glMatrix.mat4.getRotation(orientationQuat, lookAtMatrix);
    this.transform.setOrientation(orientationQuat);

    this.transform.updateMatrix();
  }

  orbitAround(deltaX, deltaY, CoR, sensitivity = 0.5) {
    const vec3 = glMatrix.vec3;
    const quat = glMatrix.quat;
    const toRadian = (deg) => (deg * Math.PI) / 180;

    // Store yaw/pitch as properties for smooth orbit
    this.yaw = (this.yaw || 180) - deltaX * sensitivity; // think "airplane turning left/right"
    this.pitch = (this.pitch || 0) - deltaY * sensitivity; // think "airplane rising nose"

    // Clamp pitch to avoid flipping
    const maxPitch = 89.9;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Create yaw and pitch quaternions
    const yawQuat = quat.create();
    quat.setAxisAngle(yawQuat, [0, 1, 0], toRadian(this.yaw));

    const pitchQuat = quat.create();
    quat.setAxisAngle(pitchQuat, [1, 0, 0], toRadian(this.pitch));

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
