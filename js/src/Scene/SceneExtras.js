import { SceneObject } from "./SceneObject.js";
import { Geometry } from "../Geom/Geometry.js";
import { Attribute } from "../GL/Attribute.js";
import { Material } from "../Shading/Material.js";
import { Transform } from "../Geom/Transform.js";
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
    this.pointMaterial = null;

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
    this.pointMaterial = null;

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
    const color = [0.3, 0.3, 0.3, 1.0]; // gray color for the grid lines
    const centerColorX = [0.43, 0.55, 0.22, 1.0]; // greenish
    const centerColorZ = [0.57, 0.26, 0.3, 1.0]; // reddish
    for (let i = -halfSize; i <= halfSize; i += step) {
      // Lines parallel to Z-axis
      combinedGeom.push(
        i,
        0,
        -halfSize,
        ...(i === 0 ? centerColorX : color),
        i,
        0,
        halfSize,
        ...(i === 0 ? centerColorX : color)
      );
      // Lines parallel to X-axis
      combinedGeom.push(
        -halfSize,
        0,
        i,
        ...(i === 0 ? centerColorZ : color),
        halfSize,
        0,
        i,
        ...(i === 0 ? centerColorZ : color)
      );
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
    this.pointMaterial = null;

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
