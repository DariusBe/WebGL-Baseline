import { GLContext } from "../GL/GLContext.js";
import { Attribute } from "../GL/Attribute.js";
import { Utils } from "../Utils/Utils.js";
import "../../../gl-matrix-min.js";
import { Vertex } from "./Primitives/Vertex.js";
import { Edge } from "./Primitives/Edge.js";
import { Face } from "./Primitives/Face.js";
import { HalfEdgeMesh } from "./Primitives/HalfEdge.js";
import { VAO } from "./VAO.js";

export class Geometry {
  geomVAO = null; // WebGL Vertex Array Object (VAO) for this geometry
  wireframeVAO = null; // WebGL VAO for wireframe rendering
  normalsVAO = null; // WebGL VAO for normals rendering
  AttributesPoolBuffer = null; // Buffer for attributes that are not separate
  attributeList = {}; // List of attributes with their locations and properties
  // Initialize all used instance properties to avoid runtime errors
  combinedGeom = [];
  mtl_data = null;
  materialAssociatedFaces = null;
  currentMaterial = null;
  objectNames = [];
  vertices = [];
  texCoords = [];
  vertexNormals = [];
  faces = [];
  faceVertices = []; // for triangle-arranged vertices
  lineVertices = []; // for line-arranged vertices
  parameterSpaceVertices = [];
  smoothShading = null;
  primitiveCount = this.faces.length * 3; // Number of primitives (triangles) in the geometry
  // Geometry for wireframe rendering consisting of vertices and barycentric coordinates
  wireframeGeom = []; // Geometry for wireframe rendering
  // Add half-edge mesh property
  halfEdgeMesh = null;
  /**
   * Creates a new Geometry instance.
   *
   * This class represents a WebGL Vertex Array Object (VAO) that contains vertex attributes and optionally an index buffer.
   * @param {WebGLBuffer} vertexBuffer - The buffer containing vertex data.
   * @param {Array<Attribute>} attributes - An array of Attribute objects defining the vertex attributes.
   * @param {WebGLBuffer} indexBuffer - Optional buffer containing indices for indexed drawing.
   */
  constructor(attributes = null, indexBuffer = null) {
    /** @type {WebGLRenderingContext} */
    const gl = GLContext.getInstance().gl;
    this.geomVAO = null;
    this.wireframeVAO = null;
    this.attributeList = new Map();
    // index is the buffer that contains the indices of the vertices
    if (indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }
    gl.bindVertexArray(null);
    this.halfEdgeMesh = new HalfEdgeMesh();
    this.init(attributes, indexBuffer);
  }
  init(attributes = null, indexBuffer = null) {
    const gl = GLContext.getInstance().gl;
    this.geomVAO = new VAO("Geometry_VAO", attributes, "DYNAMIC_DRAW");
    if (attributes !== null && attributes instanceof Array) {
      this.prepareAttributes(attributes);
    }
    this.wireframeAttributes = new Map();
    this.wireframeVAO = new VAO(
      "Wireframe_VAO",
      this.wireframeAttributes,
      "DYNAMIC_DRAW"
    );
    gl.bindVertexArray(this.geomVAO.vao);
    if (indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      this.geomVAO.indexBuffer = indexBuffer;
    } else {
      this.geomVAO.indexBuffer = null;
    }
  }
  bind(vao = this.geomVAO) {
    vao.bind();
  }
  unbind(vao = this.geomVAO) {
    vao.unbind();
  }
  /* Prepare vertex attributes for the geometry.
   * @param {Array<Attribute>} attributes - The attributes to prepare.
   */
  prepareAttributes = (attributes, vao = this.geomVAO, separate = false) => {
    const gl = GLContext.getInstance().gl;
    vao.attributes = attributes;
    vao.init();
    if (!attributes) return;
    for (const attribute of attributes) {
      this.attributeList.set(attribute.name, attribute);
    }
  };
  /**
   * Parse the .mtl-file of a wavefront model
   * @param {string} mtlSrc The path to the .mtl-file
   * @param {boolean?} verbose A flag to print info
   * @returns {list} a list of layout // @TODO add description
   *
   */
  parseMTL = async (mtlSrc, objSrc, verbose = true) => {
    this.materialAssociatedFaces = new Map();
    this.currentMaterial = null;
    const then = performance.now();
    const response = await fetch(mtlSrc);
    var content = await response.text();
    content = content.split("\n");
    content = content.filter((x) => !(x.startsWith("#") || x == ""));
    var list = {};
    var sublist = {};
    var currentSection = "";
    for (const i in content) {
      const elem = content[i];
      if (elem.startsWith("newmtl")) {
        const section = elem;
        currentSection = section.split(" ")[1];
        list[section.split(" ")[1]] = "";
        sublist = {};
      } else {
        sublist[elem.split(" ")[0]] = elem.split(" ").slice(1);
        list[currentSection] = sublist;
      }
    }
    console.info("parsed MTL:", Object.keys(list).length, "materials");
    const newResponse = await fetch(objSrc);
    content = await newResponse.text();
    const objectName = content.split("o")[2].split("v")[0].trimEnd();
    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {
      const key = lines[i].split(" ")[0];
      const value = lines[i].split(key + " ")[1];
      // check file integrity:
      const check = lines[i].split(key + " ").length;
      if ((check > 2 || check < 2) && lines[i] != "") {
        console.warn(
          "OBJ Parsing Error:\nFormat qualifier (o, v, vt, ...) must be separeted by space:\n",
          lines[i]
        );
      }
      switch (key) {
        case "#":
          break;
        default:
          break;
        case "usemtl":
          this.currentMaterial = lines[i].split("usemtl ")[1].trim();
          break;
        case "f":
          // faces.push(value);
          // objDescription['faces'].push(value);
          const face = value
            .trim()
            .split(" ")
            .map((tuple) =>
              tuple
                .trim()
                .split("/")
                .map((n) => parseFloat(n))
            );
          if (this.currentMaterial) {
            if (!this.materialAssociatedFaces.has(this.currentMaterial)) {
              this.materialAssociatedFaces.set(this.currentMaterial, []);
            }
            this.materialAssociatedFaces.get(this.currentMaterial).push(face);
          }
          break;
      }
    }
    return list;
  };
  /**
   * Parse the .mtl-file of a wavefront model
   * @param {string} src The path to the .mtl-file
   * @param {boolean?} verbose A flag to print info
   * @param {string?} mtl_src Optionally, the path to an .mtl-file
   * @returns {ModelOBJ} a ModelOBJ object containing geometry lists
   */
  parseOBJFile = async (src, mtl_src = null, verbose = false) => {
    const then = performance.now();
    const response = await fetch(src);
    const content = await response.text();
    const objectName = content.split("o")[2].split("v")[0].trimEnd();
    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {
      const key = lines[i].split(" ")[0];
      const value = lines[i].split(key + " ")[1];
      // check file integrity:
      const check = lines[i].split(key + " ").length;
      if ((check > 2 || check < 2) && lines[i] != "") {
        console.warn(
          "OBJ Parsing Error:\nFormat qualifier (o, v, vt, ...) must be separeted by space:\n",
          lines[i]
        );
      }
      switch (key) {
        case "#":
          break;
        default:
          break;
        case "o":
          // objName = value;
          // objDescription['object_name'].push(value);
          this.objectNames.push(value.trim());
          break;
        case "v":
          // vertices.push(value);
          // objDescription['vertices'].push(value);
          this.vertices.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vt":
          // texCoords.push(value);
          // objDescription['tex_coords'].push(value);
          this.texCoords.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vn":
          // vertexNormals.push(value);
          // objDescription['vertex_normals'].push(value);
          this.vertexNormals.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "f":
          // faces.push(value);
          // objDescription['faces'].push(value);
          this.faces.push(
            value
              .trim()
              .split(" ")
              .map((tuple) =>
                tuple
                  .trim()
                  .split("/")
                  .map((n) => parseFloat(n))
              )
          );
          break;
        case "l":
          // lineElements.push(value);
          // objDescription['line_elements'].push(value);
          this.lineElements.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vp":
          // parameterSpaceVertices.push(value);
          // objDescription['parameter_space_vertices'].push(value);
          this.parameterSpaceVertices.push(value.trim().split(" "));
          break;
        case "s":
          // objDescription['smooth_shading'].push(smoothShading);
          this.smoothShading = value.trim();
          break;
      }
    }
    let mtl_data = null;
    if (mtl_src != null) {
      this.mtl_data = await this.parseMTL(mtl_src, src, verbose);
    }
    for (const [lineIndex, line] of Object.entries(this.lineElements)) {
      // Process each line element
      // console.warn(lineIndex, "Line Element:", line);
      let v1_location = line[0] - 1; // Convert to zero-based index
      let v2_location = line[1] - 1; // Convert to zero-based index
      // Create vertices for the line
      const lineSegment = [
        this.vertices[v1_location],
        this.vertices[v2_location],
      ];
      this.lineVertices.push(...lineSegment[0], ...lineSegment[1]);
    }
    for (const face in Object.entries(this.faces)) {
      // f v_1/X/X     v_2/X/X     v_3/X/X
      let v1_location = this.faces[face][0][0] - 1;
      let v2_location = this.faces[face][1][0] - 1;
      let v3_location = this.faces[face][2][0] - 1;
      // f X/vt_1/X    X/vt_2/X    X/vt_3/X
      const vt1_location = this.faces[face][0][1] - 1;
      const vt2_location = this.faces[face][1][1] - 1;
      const vt3_location = this.faces[face][2][1] - 1;
      // equals f X/X/vn_1    X/X/vn_2    X/X/vn_3
      const vn1_location = this.faces[face][0][2] - 1;
      const vn2_location = this.faces[face][1][2] - 1;
      const vn3_location = this.faces[face][2][2] - 1;
      const v_1 = this.vertices[v1_location];
      const v_2 = this.vertices[v2_location];
      const v_3 = this.vertices[v3_location];
      var vt_1 = 0;
      var vt_2 = 0;
      var vt_3 = 0;
      if (this.texCoords.length == 0) {
        console.warn(
          "OBJ Parser: OBJ-File",
          src,
          "does not contain Texture Coordinates."
        );
      } else {
        vt_1 = this.texCoords[vt1_location];
        vt_2 = this.texCoords[vt2_location];
        vt_3 = this.texCoords[vt3_location];
      }
      if (this.vertexNormals.length == 0) {
        console.warn(
          "OBJ Parser: OBJ-File",
          src,
          "does not contain Vertex Normals."
        );
      }
      const nor_a = this.vertexNormals[vn1_location];
      const nor_b = this.vertexNormals[vn2_location];
      const nor_c = this.vertexNormals[vn3_location];
      // Determine color for this face
      let colR = Math.random();
      let colG = Math.random();
      let colB = Math.random();
      // Find the material for this face
      if (this.materialAssociatedFaces && this.mtl_data) {
        for (const [material, materialFaces] of this.materialAssociatedFaces) {
          // Check if current face belongs to this material
          const currentFaceData = this.faces[face];
          // .some() checks if at least one face matches the current face data and returns true if it does
          const faceMatches = materialFaces.some(
            (matFace) =>
              matFace.length === currentFaceData.length &&
              matFace.every(
                (vertex, idx) =>
                  vertex[0] === currentFaceData[idx][0] &&
                  vertex[1] === currentFaceData[idx][1] &&
                  vertex[2] === currentFaceData[idx][2]
              )
          );
          if (faceMatches && this.mtl_data[material]?.Kd) {
            colR = parseFloat(this.mtl_data[material].Kd[0]);
            colG = parseFloat(this.mtl_data[material].Kd[1]);
            colB = parseFloat(this.mtl_data[material].Kd[2]);
            break;
          }
        }
      }
      const barycentric_1 = [1.0, 0.0, 0.0];
      const barycentric_2 = [0.0, 1.0, 0.0];
      const barycentric_3 = [0.0, 0.0, 1.0];
      const rgb = [colR, colG, colB];
      this.combinedGeom.push(
        ...v_1,
        ...vt_1,
        ...nor_a,
        ...rgb,
        ...barycentric_1,
        ...v_2,
        ...vt_2,
        ...nor_b,
        ...rgb,
        ...barycentric_2,
        ...v_3,
        ...vt_3,
        ...nor_c,
        ...rgb,
        ...barycentric_3
      );
      this.faceVertices.push([v_3, v_2, v_1]);
    }
    // this.buildHalfEdgeMesh();
    // }
    if (verbose) {
      console.groupCollapsed("parsed OBJ-file");
      console.log("Object Name:", objectName);
      console.groupCollapsed("Vertices:", this.vertices.length);
      console.log(this.vertices);
      console.groupEnd();
      console.groupCollapsed("Texture Coordinates:", this.texCoords.length);
      console.log(this.texCoords);
      console.groupEnd();
      console.groupCollapsed("Vertex Normals:", this.vertexNormals.length);
      console.log(this.vertexNormals);
      console.groupEnd();
      console.groupCollapsed("Faces:", this.faces.length);
      console.log(this.faces);
      console.groupEnd();
      console.groupCollapsed("Line Elements:", this.lineElements.length);
      console.log(this.lineElements);
      console.groupEnd();
      console.groupCollapsed(
        "Parameter Space Vertices:",
        this.parameterSpaceVertices.length
      );
      console.log(this.parameterSpaceVertices);
      console.groupEnd();
      console.log("Smooth Shading:", this.smoothShading);
      console.groupCollapsed(
        "combined attributes buffer:",
        this.combinedGeom.length
      );
      console.log(this.combinedGeom);
      console.groupEnd();
      console.groupEnd();
    }
  };
  prepareOBJAttributes = () => {
    // is this.combined depth = 1?
    if (this.combinedGeom.length == 0) {
      console.warn(
        "Geometry.prepareOBJAttributes: No combined attributes found. Please parse the OBJ file first."
      );
      return;
    }
    if (this.combinedGeom.length != 0) {
      const defaultAttributes = [
        new Attribute(
          "aPosition",
          0,
          3,
          "FLOAT",
          false,
          14 * 4, // 14 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color, 3 for barycentric)
          0, // Offset for position
          new Float32Array(this.combinedGeom)
        ),
        new Attribute(
          "aTexCoord",
          1,
          2,
          "FLOAT",
          false,
          14 * 4, // 14 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color, 3 for barycentric)
          3 * 4, // Offset for texture coordinates
          new Float32Array(this.combinedGeom)
        ),
        new Attribute(
          "aNormal",
          2,
          3,
          "FLOAT",
          false,
          14 * 4, // 14 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color, 3 for barycentric)
          5 * 4, // Offset for normal
          new Float32Array(this.combinedGeom)
        ),
        new Attribute(
          "aColor",
          3,
          3,
          "FLOAT",
          false,
          14 * 4, // 14 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color, 3 for barycentric)
          8 * 4, // Offset for color
          new Float32Array(this.combinedGeom)
        ),
        new Attribute(
          "aBarycentric",
          4,
          3,
          "FLOAT",
          false,
          14 * 4, // 14 BYTES per vertex (3 for position, 2 for texture coordinates, 3 for normal, 3 for color, 3 for barycentric)
          11 * 4, // Offset for barycentric coordinates
          new Float32Array(this.combinedGeom)
        ),
      ];
      this.prepareAttributes(defaultAttributes);
    }
  };
  updateCombinedList = (
    vertices = null,
    texCoords = null,
    normals = null,
    colors = null
  ) => {
    const lines = this.combinedGeom.length / 11.0;
    const stride = 11; // 3 for position, 2 for texture coordinates, 3 for normal, 3 for color
    // If no attributes are provided, return early
    if (
      vertices === null &&
      texCoords === null &&
      normals === null &&
      colors === null
    ) {
      console.warn(
        "Geometry.updateCombinedList: No attributes provided to update."
      );
      return;
    }
    // Use safe lengths for each attribute array, falling back to 0 if null
    const verticesLength = Array.isArray(vertices) ? vertices.length : 0;
    const texCoordsLength = Array.isArray(texCoords) ? texCoords.length : 0;
    const normalsLength = Array.isArray(normals) ? normals.length : 0;
    const colorsLength = Array.isArray(colors) ? colors.length : 0;
    if (vertices !== null) {
      // Ensure vertices is a flat array
      if (!Array.isArray(vertices[0])) {
        vertices = vertices.map((v) => [v.x, v.y, v.z]);
      }
      // overwrite existing vertices
      this.combinedGeom = this.combinedGeom.slice(0, lines * stride);
      for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        if (!Array.isArray(v) || v.length !== 3) {
          console.warn(
            `Geometry.updateCombinedList: Vertex at index ${i} does not have 3 components.`
          );
          continue;
        }
        this.combinedGeom.push(...v);
      }
    }
    if (texCoords !== null) {
      // Ensure texCoords is a flat array
      if (!Array.isArray(texCoords[0])) {
        texCoords = texCoords.map((tc) => [tc.u, tc.v]);
      }
      // overwrite existing texture coordinates
      this.combinedGeom = this.combinedGeom.slice(
        0,
        lines * stride + verticesLength * 2
      );
      for (let i = 0; i < texCoords.length; i++) {
        const tc = texCoords[i];
        if (!Array.isArray(tc) || tc.length !== 2) {
          console.warn(
            `Geometry.updateCombinedList: Texture coordinate at index ${i} does not have 2 components.`
          );
          continue;
        }
        this.combinedGeom.push(...tc);
      }
    }
    if (normals !== null) {
      // Ensure normals is a flat array
      if (!Array.isArray(normals[0])) {
        normals = normals.map((n) => [n.x, n.y, n.z]);
      }
      // overwrite existing normals
      this.combinedGeom = this.combinedGeom.slice(
        0,
        lines * stride + verticesLength * 2 + texCoordsLength * 2
      );
      for (let i = 0; i < normals.length; i++) {
        const n = normals[i];
        if (!Array.isArray(n) || n.length !== 3) {
          console.warn(
            `Geometry.updateCombinedList: Normal at index ${i} does not have 3 components.`
          );
          continue;
        }
        this.combinedGeom.push(...n);
      }
    }
    if (colors !== null) {
      // Ensure colors is a flat array
      if (!Array.isArray(colors[0])) {
        colors = colors.map((c) => [c.r, c.g, c.b]);
      }
      // overwrite existing colors
      this.combinedGeom = this.combinedGeom.slice(
        0,
        lines * stride +
          verticesLength * 2 +
          texCoordsLength * 2 +
          normalsLength * 3
      );
      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        if (!Array.isArray(c) || c.length !== 3) {
          console.warn(
            `Geometry.updateCombinedList: Color at index ${i} does not have 3 components.`
          );
          continue;
        }
        this.combinedGeom.push(...c);
      }
    }
    // Update the geomVAO
    const gl = GLContext.getInstance().gl;
    gl.bindVertexArray(this.geomVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.AttributesPoolBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.combinedGeom),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    console.log(
      `Geometry.updateCombinedList: Updated combined list with ${this.combinedGeom.length} components.`
    );
  };
  // Add method to build half-edge mesh after OBJ parsing
  buildHalfEdgeMesh = () => {
    if (this.vertices.length === 0 || this.faces.length === 0) {
      console.warn(
        "Geometry.buildHalfEdgeMesh: No vertices or faces found. Parse OBJ file first."
      );
      return;
    }
    this.halfEdgeMesh.buildFromOBJ(
      this.vertices,
      this.faces,
      this.texCoords,
      this.vertexNormals
    );
    console.info(
      `Built half-edge mesh with ${this.halfEdgeMesh.vertices.length} vertices, ${this.halfEdgeMesh.faces.length} faces, and ${this.halfEdgeMesh.halfEdges.length} half-edges.`
    );
  };
}
