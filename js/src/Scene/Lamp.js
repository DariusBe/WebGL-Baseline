import { Transform } from "../Geom/Transform.js";
import { SceneObject } from "./SceneObject.js";
import { Gizmo } from "./SceneExtras.js";
import { Geometry } from "../Geom/Geometry.js";
import { Material } from "../Shading/Material.js";

export class Lamp extends SceneObject {
  constructor(name = "Lamp", kind, intensity, transform) {
    super(name, null, null);
    this.kind = kind || "lamp";
    this.intensity = intensity || 1.0;
    this.transform = transform || new Transform();
    this.gizmo = new Gizmo(name, "lamp", transform);
    this.activeMaterial = this.gizmo.activeMaterial;
    this.geometry = this.gizmo.geometry;
    this.pointMaterial = null;
    this.transform.setScale(0.25, 0.25, 0.25);
    this.geometry.name = name;
  }
}
