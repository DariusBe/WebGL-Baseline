import { GLContext } from "./GLContext.js";
import { ShaderProgram } from "./ShaderProgram.js";
import { Material } from "./Material.js";
import { Geometry } from "./Geometry.js";
import { Transform } from "./Transform.js";
import { Uniform } from "./Uniform.js";
import "../../gl-matrix-min.js";

export class SceneObject {
  constructor(geometry = null, material = null, transform = null) {
    this.geometry = geometry;
    this.program = null; // Will be set when the material is attached
    this.material = material;
    this.transform = transform;

    if (this.transform == null) {
      this.transform = new Transform();
    }
    if (this.geometry == null) {
      this.geometry = new Geometry();
    }
    if (this.material == null) {
      this.material = new Material("defaultMaterial");
    }
  }

  updateTransformUniforms() {
    if (this.material && this.material.uniformData) {
      this.material.setUniform(
        new Uniform("uModel", "mat4", this.transform.matrix)
      );
    }
  }
}
