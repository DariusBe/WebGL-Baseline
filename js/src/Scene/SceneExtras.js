import { SceneObject } from "./SceneObject.js";
import { Geometry } from "../Geom/Geometry.js";
import { Attribute } from "../GL/Attribute.js";
import { Material } from "../Shading/Material.js";
import { Transform } from "../Scene/Transform.js";
import { Utils } from "../Utils/Utils.js";
import { Texture } from "../Shading/Texture.js";
import { ShaderProgram } from "../GL/ShaderProgram.js";
import { Uniform } from "../GL/Uniform.js";

const gizmoMaterial = new Material(
  "GizmoMaterial",
  new ShaderProgram(
    await Utils.readShaderFile("js/src/Shading/extras/gizmo/gizmo.vert"),
    await Utils.readShaderFile("js/src/Shading/extras/gizmo/gizmo.frag"),
    "GizmoShader"
  )
);

const gridMaterial = new Material(
  "GridMaterial",
  new ShaderProgram(
    await Utils.readShaderFile("js/src/Shading/extras/grid/grid.vert"),
    await Utils.readShaderFile("js/src/Shading/extras/grid/grid.frag"),
    "GridShader"
  )
);

const curveMaterial = new Material(
  "CurveMaterial",
  new ShaderProgram(
    await Utils.readShaderFile("js/src/Shading/bezier/bezier.vert"),
    await Utils.readShaderFile("js/src/Shading/bezier/bezier.frag"),
    "CurveShader"
  )
);

const lampGizmoOBJ = await SceneObject.createFromOBJ(
  "resources/models/gizmos/sun.obj",
  null,
  false
);

// Gizmo
export class Gizmo extends SceneObject {
  constructor(name = "Gizmo", kind = "lamp", transform = null) {
    super(
      name,
      lampGizmoOBJ.geometry,
      gizmoMaterial,
      transform || new Transform()
    );
    this.kind = kind;

    this.geometry.name = name;
    this.geometry.primitiveCount = this.geometry.lineVertices.length / 3; // Each vertex has 3 components (x, y, z)
    this.geometry.prepareAttributes([
      new Attribute(
        "aPosition",
        0,
        3,
        "FLOAT",
        false,
        // Stride: XYZ RGBA * 4
        3 * 4,
        0, // Offset for position
        new Float32Array(this.geometry.lineVertices.flat())
      ),
    ]);
  }
}

// Grid
export class Grid extends SceneObject {
  constructor(name = "Grid", size = 10, resolution = 24, transform = null) {
    super(name, null, gridMaterial, transform || new Transform());
    this.size = size;
    this.resolution = resolution;

    this.geometry = new Geometry();
    this.geometry.lineVertices = this.gridBuilder();
    this.geometry.primitiveCount = this.geometry.lineVertices.length / 7; // Each vertex has 3 position components and 4 color components (XYZ RGBA)
    // console.log(this.geometry.lineVertices, this.geometry.primitiveCount);

    this.geometry.prepareAttributes([
      new Attribute(
        "aPosition",
        0,
        3,
        "FLOAT",
        false,
        // Stride: XYZ RGBA * 4
        7 * 4, // Size of each vertex in bytes (3 floats for position, 4 floats for color)
        0, // Offset for position
        new Float32Array(this.geometry.lineVertices.flat())
      ),
      new Attribute(
        "aColor",
        1,
        4,
        "FLOAT",
        false,
        // Stride: XYZ RGBA * 4
        7 * 4, // Size of each vertex in bytes (3 floats for position, 4 floats for color)
        3 * 4, // Offset for color
        new Float32Array(this.geometry.lineVertices.flat())
      ),
    ]);
  }

  gridBuilder = () => {
    let combinedGeom = [];
    const halfSize = this.size / 2;
    const step = this.size / this.resolution;
    const color = [0.0, 1.0, 0.0, 1.0]; // Green color for the grid lines
    for (let i = -halfSize; i <= halfSize; i += step) {
      // Horizontal lines
      combinedGeom.push(-halfSize, 0, i, ...color);
      combinedGeom.push(halfSize, 0, i, ...color);

      // Vertical lines
      combinedGeom.push(i, 0, -halfSize, ...color);
      combinedGeom.push(i, 0, halfSize, ...color);
    }

    return combinedGeom;
  };
}

export class Bezier extends SceneObject {
  constructor(name = "Bezier", transform = null) {
    super(name, null, curveMaterial, transform || new Transform());
    this.geometry = new Geometry();
    this.geometry.lineVertices = [];
    this.geometry.primitiveCount = 0;

    this.resolution = 250; // Number of segments for the Bezier curve
    this.activeMaterial.setUniform(
      new Uniform("uInstanceCount", "int", this.resolution)
    );

    this.geometry.lineVertices = [
      // Example Bezier curve points
      [0.0, 0.0, 0.0],
    ];

    this.geometry.prepareAttributes([
      new Attribute(
        "aPosition",
        0,
        3,
        "FLOAT",
        false,
        // Stride: XYZ RGBA * 4
        3 * 4,
        0, // Offset for position
        new Float32Array(this.geometry.lineVertices.flat())
      ),
    ]);
  }
}
