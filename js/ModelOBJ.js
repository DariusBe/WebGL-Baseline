export class ModelOBJ {
  name = "ModelOBJ";
  data = null;
  vertices = [];
  vertexNormals = [];
  texCoords = [];
  faces = [];
  lineElements = [];
  parameterSpaceVertices = [];
  objectNames = [];
  smoothShading = [];
  combined = [];
  constructor(src, mtl_src = null, verbose = true) {
    this.vertices = [];
    this.vertexNormals = [];
    this.texCoords = [];
    this.faces = [];
    this.lineElements = [];
    this.parameterSpaceVertices = [];
    this.objectNames = [];
    this.smoothShading = [];
    this.combined = [];
    if (src != null && src != undefined) {
      data = this.parseOBJFile(src, verbose, mtl_src);
      this.vertices = data.vertices;
      this.vertexNormals = data.vertexNormals;
      this.texCoords = data.texCoords;
      this.faces = data.faces;
      this.lineElements = data.lineElements;
      this.parameterSpaceVertices = data.parameterSpaceVertices;
      this.objectNames = data.objectNames;
      this.smoothShading = data.smoothShading;
      this.combined = data.combined;
    }
  }

  printObjectDescription() {
    var objDescription = {
      object_names: [this.objectNames, null],
      vertices: [
        this.vertices,
        "Vertices, with (x, y, z, [w]) coordinates. w is optional and defaults to 1.0.",
      ],
      tex_coords: [
        this.texCoords,
        "Texture Coordinates in (u, [v, w]) coordinates. These will vary between 0 and 1. v, w are optional and default to 0.",
      ],
      vertex_normals: [
        this.vertexNormals,
        "Vertex normals in (x,y,z) form; normals might not be unit vectors.",
      ],
      faces: [
        this.faces,
        "Polygonal face definition using lists of vertex, texture and normal indices in the format vertex_index / texture_index / normal_index for which each index starts at 1 and increases corresponding to the order in which the referenced element was defined.",
      ],
      line_elements: [
        this.lineElements,
        "Line elements specified by the order of the vertices which build a polyline.",
      ],
      parameter_space_vertices: [
        this.parameterSpaceVertices,
        "Parameter space vertices in (u, [v, w]) form; free form geometry statement for control points of rational trimming curves.",
      ],
      smooth_shading: [this.smoothShading, null],
      combined: [
        this.combined,
        "The final object description including vertices as reconstructed by face-list, texCoords, normals and Color values for the render buffer.",
      ],
    };

    // console.group('OBJ Description:');
    console.groupCollapsed("OBJ-File:", ...objDescription.object_names[0]);
    for (const [key, [val, description]] of Object.entries(objDescription)) {
      const entryLength = val.length;
      // console.log(val, entryLength);
      if (entryLength == 0) {
        continue;
      }
      if (entryLength > 1) {
        console.groupCollapsed(key);
        console.info(description);
        console.info("Lenght:", val.length);
        console.table(val);
        console.groupEnd();
      } else {
        console.log(key + ":", ...val);
      }
    }
    console.groupEnd();
  }

  /**
   * Parse the .mtl-file of a wavefront model
   * @param {string} src The path to the .mtl-file
   * @param {boolean?} verbose A flag to print info
   * @returns {list} a list of layout // @TODO add description
   *
   */
  parseMTL = async (src, verbose = true) => {
    const then = performance.now();
    const response = await fetch(src);
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
    console.log(
      "Parsed MTL-File",
      '"' + src + '"',
      "in",
      performance.now() - then,
      "ms."
    );
    return list;
  };

  /**
   * Parse the .mtl-file of a wavefront model
   * @param {string} src The path to the .mtl-file
   * @param {boolean?} verbose A flag to print info
   * @param {string?} mtl_src Optionally, the path to an .mtl-file
   * @returns {ModelOBJ} a ModelOBJ object containing geometry lists
   */
  parseOBJFile = async (src, verbose = true, mtl_src = "") => {
    const then = performance.now();
    const response = await fetch(src);
    const content = await response.text();
    // console.log(content);
    const objectName = content.split("o")[2].split("v")[0].trimEnd();
    var lines = content.split("\n");

    var obj = new ModelOBJ();

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
          console.log(value);
          obj.objectNames.push(value.trim());
          break;
        case "v":
          // vertices.push(value);
          // objDescription['vertices'].push(value);
          obj.vertices.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vt":
          // texCoords.push(value);
          // objDescription['tex_coords'].push(value);
          obj.texCoords.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vn":
          // vertexNormals.push(value);
          // objDescription['vertex_normals'].push(value);
          obj.vertexNormals.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "f":
          // faces.push(value);
          // objDescription['faces'].push(value);
          obj.faces.push(
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
          obj.lineElements.push(
            value
              .trim()
              .split(" ")
              .map((c) => parseFloat(c))
          );
          break;
        case "vp":
          // parameterSpaceVertices.push(value);
          // objDescription['parameter_space_vertices'].push(value);
          obj.parameterSpaceVertices.push(value.trim().split(" "));
          break;
        case "s":
          // objDescription['smooth_shading'].push(smoothShading);
          obj.smoothShading = value.trim();
          break;
      }
    }

    mtl_src;
    if (mtl_src != "") {
      if (verbose) {
        this.parseMTL(mtl_src, verbose);
      }
    }

    // if (!facesListEmpty) {
    for (const face in Object.entries(obj.faces)) {
      // f v_1/X/X     v_2/X/X     v_3/X/X
      const v1_location = obj.faces[face][0][0] - 1;
      const v2_location = obj.faces[face][1][0] - 1;
      const v3_location = obj.faces[face][2][0] - 1;

      // f X/vt_1/X    X/vt_2/X    X/vt_3/X
      const vt1_location = obj.faces[face][0][1] - 1;
      const vt2_location = obj.faces[face][1][1] - 1;
      const vt3_location = obj.faces[face][2][1] - 1;

      // equals f X/X/vn_1    X/X/vn_2    X/X/vn_3
      const vn1_location = obj.faces[face][0][2] - 1;
      const vn2_location = obj.faces[face][1][2] - 1;
      const vn3_location = obj.faces[face][2][2] - 1;

      const v_1 = obj.vertices[v1_location];
      const v_2 = obj.vertices[v2_location];
      const v_3 = obj.vertices[v3_location];

      var vt_1 = 0;
      var vt_2 = 0;
      var vt_3 = 0;
      if (obj.texCoords.length == 0) {
        console.warn(
          "OBJ Parser: OBJ-File",
          src,
          "does not contain Texture Coordinates."
        );
      } else {
        vt_1 = obj.texCoords[vt1_location];
        vt_2 = obj.texCoords[vt2_location];
        vt_3 = obj.texCoords[vt3_location];
      }
      if (obj.vertexNormals.length == 0) {
        console.warn(
          "OBJ Parser: OBJ-File",
          src,
          "does not contain Vertex Normals."
        );
      }
      const nor_a = obj.vertexNormals[vn1_location];
      const nor_b = obj.vertexNormals[vn2_location];
      const nor_c = obj.vertexNormals[vn3_location];

      const colR = Math.random();
      const colG = Math.random();
      const colB = Math.random();

      const rgb = [colR, colG, colB];
      obj.combined.push(
        ...v_1,
        ...vt_1,
        ...nor_a,
        ...rgb,

        ...v_2,
        ...vt_2,
        ...nor_b,
        ...rgb,

        ...v_3,
        ...vt_3,
        ...nor_c,
        ...rgb
      );
    }
    // }
    console.log(
      "Parsed OBJ-file",
      '"' + src + '"',
      "in",
      performance.now() - then,
      "ms."
    );
    // console.log(Utils.printMatrix(obj.combined, 6, obj.combined.length / 6, 1));
    return obj;
  };
}
