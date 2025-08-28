import { GLContext } from "../GL/GLContext.js";
import { ShaderProgram } from "../GL/ShaderProgram.js";
import { Material } from "../Shading/Material.js";
import { Geometry } from "../Geom/Geometry.js";
import { Transform } from "./Transform.js";
import { Uniform } from "../GL/Uniform.js";
import { HalfEdgeMesh } from "../Geom/Primitives/HalfEdge.js";
import { Utils } from "../Utils/Utils.js";
import { UUID } from "../Utils/UUID.js";
import "../../../gl-matrix-min.js";

const wireFrameVertCode = await Utils.readShaderFile(
  "js/src/Shading/wireframe/wireframe.vert"
);
const wireFrameFragCode = await Utils.readShaderFile(
  "js/src/Shading/wireframe/wireframe.frag"
);

export class SceneObject {
  constructor(
    name = "newSceneObject",
    geometry = null,
    material = null,
    transform = null
  ) {
    this.name = name;
    this.children = new Map();
    this.geometry = geometry || new Geometry();
    this.materials = new Map(material ? [[material.name, material]] : []);
    this.activeMaterial = material || null;
    this.solidMaterial = null;
    this.wireframeMaterial = null;
    this.transform = transform || new Transform();
    this.selected = false; // Selection state

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
    this.pickingColor = UUID.uuidToRGBA(this);

    if (this.materials.size > 0) {
      // If materials are provided, set the first one as active
      this.activeMaterial = this.materials.values().next().value;
      this.activeMaterial.use();
      this.updateTransformUniforms();
    }

    if (
      this.activeMaterial != null &&
      this.activeMaterial instanceof Material
    ) {
      this.activeMaterial.use();
      this.activeMaterial.setUniform(
        new Uniform("uPickingColor", "vec4", this.pickingColor),
        new Uniform("uSelected", "bool", this.selected)
      );
    }

    this.solidMaterial = this.activeMaterial;
    if (this.wireframeMaterial == null) {
      this.createWireframeShader();
      this.wireframeMaterial.setUniform(
        new Uniform("uPickingColor", "vec4", this.pickingColor),
        new Uniform("uSelected", "bool", this.selected)
      );
    }
  }

  static createFromOBJ = async (
    objSrc,
    mtlSrc = null,
    prepareAttribs = true
  ) => {
    const obj = new SceneObject();
    obj.geometry.vertices = [];
    obj.geometry.vertexNormals = [];
    obj.geometry.texCoords = [];
    obj.geometry.faces = [];
    obj.geometry.lineElements = [];
    obj.geometry.parameterSpaceVertices = [];
    obj.geometry.objectNames = [];
    obj.geometry.smoothShading = [];
    obj.geometry.combinedGeom = [];

    try {
      await obj.geometry.parseOBJFile(objSrc, mtlSrc);
    } catch (error) {
      console.error("Error parsing OBJ file:", error);
    }
    if (obj.geometry.objectNames.length === 1) {
      // set this instance's name to the object name from the OBJ file
      obj.name = obj.geometry.objectNames[0];
    }

    if (obj.geometry.combinedGeom.length > 0 && prepareAttribs) {
      obj.geometry.prepareOBJAttributes();
    }
    return obj;
  };

  updateTransformUniforms() {
    if (this.activeMaterial && this.activeMaterial.uniformData) {
      this.activeMaterial.setUniform(
        new Uniform("uModel", "mat4", this.transform.matrix)
      );
    }
  }

  useMaterial(materialName) {
    for (const [name, material] of this.materials) {
      if (name === materialName) {
        this.activeMaterial = material;
        material.use();
        this.activeMaterial.setUniform(
          new Uniform("uPickingColor", "vec4", this.pickingColor)
        );
        this.updateTransformUniforms();
        return;
      }
    }
  }

  addMaterial(material, setActive = false) {
    if (material instanceof Material) {
      this.solidMaterial = material; // Set solid material
      this.solidMaterial.name = material.name || "SolidMaterial";
      this.materials.set(material.name, material);
      if (setActive) {
        this.activeMaterial = material;
        material.use();
        this.activeMaterial.setUniform(
          new Uniform("uPickingColor", "4fv", this.pickingColor)
        );
        this.updateTransformUniforms();
      }
    } else {
      console.error("Material must be an instance of Material class.");
    }
  }

  toggleWireframe() {
    // if wireframeMaterial exists
    if (this.wireframeMaterial) {
      // If wireframe material is already created, toggle it
      if (this.activeMaterial === this.wireframeMaterial) {
        this.activeMaterial = this.solidMaterial; // Switch back to solid material
        console.log("Switching to solid material:", this.activeMaterial);
      } else {
        this.activeMaterial = this.wireframeMaterial; // Enable wireframe
      }
    } else {
      // Create wireframe material if it doesn't exist
      this.createWireframeShader();
      this.activeMaterial = this.wireframeMaterial;
    }
  }

  createWireframeShader() {
    this.wireframeMaterial = new Material(
      "WireframeMaterial",
      new ShaderProgram(
        wireFrameVertCode,
        wireFrameFragCode,
        "WireframeShaderProgram"
      )
    );
    this.wireframeMaterial.setUniform(
      new Uniform("uModel", "mat4", this.transform.getMatrix()),
      new Uniform("uSelected", "bool", this.selected)
    );
    this.materials.set(this.wireframeMaterial.name, this.wireframeMaterial);
  }

  addChild(child) {
    this.children.set(child.name, child);
  }

  removeChild(child) {
    const ret = this.children.delete(child.name);
    ret
      ? console.info(`removal of ${child.name} successful`)
      : console.error(`removal of ${child.name} failed`);
  }

  toggleSelected() {
    this.selected = !this.selected;
    const uniform = new Uniform("uSelected", "bool", this.selected);
    if (this.activeMaterial) {
      this.activeMaterial.setUniform(uniform);
    }

    if (this.wireframeMaterial) {
      this.wireframeMaterial.setUniform(uniform);
    }
  }

  equals(other) {
    return other instanceof SceneObject && this.getUUID() === other.getUUID();
  }
}
