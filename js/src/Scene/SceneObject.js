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

export class SceneObject {
  constructor(
    name = "newSceneObject",
    geometry = null,
    material = null,
    transform = null
  ) {
    this.name = name;
    this.children = [];
    this.geometry = geometry || new Geometry();
    this.materials = new Map(material ? [[material.name, material]] : []);
    this.activeMaterial = material || null;
    this.transform = transform || new Transform();

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
    }
    this.createWireframeShader();

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };
  }

  static createFromOBJ = async (objSrc, mtlSrc = null) => {
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

    obj.geometry.prepareOBJAttributes();
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
        this.updateTransformUniforms();
        return;
      }
    }
  }

  addMaterial(material, setActive = false) {
    if (material instanceof Material) {
      this.materials.set(material.name, material);
      if (setActive) {
        this.activeMaterial = material;
        material.use();
        this.updateTransformUniforms();
      }
    } else {
      console.error("Material must be an instance of Material class.");
    }
  }

  showWireframe() {
    if (!this.materials.has("WireframeMaterial")) {
      this.createWireframeShader();
    }
    this.useMaterial("WireframeMaterial");
    this.geometry.prepareWireframeAttributes();
    this.geometry.wireframeVAO.bind();
  }

  async createWireframeShader() {
    let vertexSrc = await Utils.readShaderFile(
      "./js/src/Shading/wireframe/wireframe.vert"
    );
    let fragmentSrc = await Utils.readShaderFile(
      "./js/src/Shading/wireframe/wireframe.frag"
    );
    const wireframeMaterial = new Material(
      "WireframeMaterial",
      new ShaderProgram(vertexSrc, fragmentSrc, "WireframeShaderProgram")
    );
    wireframeMaterial.setUniform(
      new Uniform("uModel", "mat4", this.transform.matrix)
    );
    this.materials.set(wireframeMaterial.name, wireframeMaterial);
  }

  addChild(child) {
    this.children.push(child);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    } else {
      console.warn("Child not found in children array.");
    }
  }

  equals(other) {
    return other instanceof SceneObject && this.getUUID() === other.getUUID();
  }
}
