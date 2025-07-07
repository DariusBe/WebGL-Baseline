import { Face } from "./Face.js";
import { Vertex } from "./Vertex.js";

export class HalfEdge {
  constructor(vertex = null, face = null) {
    this.vertex = vertex; // Vertex at the end of this half-edge
    this.twin = null; // Opposite half-edge
    this.next = null; // Next half-edge in the face
    this.face = face; // Face this half-edge borders
  }
}

export class HalfEdgeMesh {
  constructor() {
    this.vertices = [];
    this.faces = [];
    this.halfEdges = [];
  }

  // Build half-edge mesh from OBJ data
  buildFromOBJ(objVertices, objFaces, objTexCoords = [], objNormals = []) {
    // Create vertices
    for (let i = 0; i < objVertices.length; i++) {
      const v = objVertices[i];
      const vertex = new Vertex(v[0], v[1], v[2]);

      // Add texture coordinates if available
      if (objTexCoords[i]) {
        vertex.texCoord = { u: objTexCoords[i][0], v: objTexCoords[i][1] };
      }

      // Add normals if available
      if (objNormals[i]) {
        vertex.normal = {
          x: objNormals[i][0],
          y: objNormals[i][1],
          z: objNormals[i][2],
        };
      }

      this.vertices.push(vertex);
    }

    // Create faces and half-edges
    const edgeMap = new Map(); // Map to find twin edges

    for (let i = 0; i < objFaces.length; i++) {
      const objFace = objFaces[i];
      const face = new Face();
      this.faces.push(face);

      const faceHalfEdges = [];

      // Create half-edges for this face
      for (let j = 0; j < objFace.length; j++) {
        let halfEdge = new HalfEdge();
        halfEdge.face = face;
        halfEdge.vertex = this.vertices[objFace[j][0] - 1]; // OBJ uses 1-based indexing

        // Set vertex's half-edge if not already set
        if (!halfEdge.vertex.halfEdge) {
          halfEdge.vertex.halfEdge = halfEdge;
        }

        faceHalfEdges.push(halfEdge);
        this.halfEdges.push(halfEdge);
      }

      // Link next/prev pointers
      for (let j = 0; j < faceHalfEdges.length; j++) {
        faceHalfEdges[j].next = faceHalfEdges[(j + 1) % faceHalfEdges.length];
        faceHalfEdges[j].prev =
          faceHalfEdges[(j - 1 + faceHalfEdges.length) % faceHalfEdges.length];
      }

      // Set face's half-edge
      face.halfEdge = faceHalfEdges[0];

      // Store edges for twin finding
      for (let j = 0; j < faceHalfEdges.length; j++) {
        const he = faceHalfEdges[j];
        const v1 = he.prev.vertex;
        const v2 = he.vertex;
        const edgeKey = `${Math.min(v1.x, v2.x)},${Math.min(
          v1.y,
          v2.y
        )},${Math.min(v1.z, v2.z)}-${Math.max(v1.x, v2.x)},${Math.max(
          v1.y,
          v2.y
        )},${Math.max(v1.z, v2.z)}`;

        if (edgeMap.has(edgeKey)) {
          // Found twin
          const twin = edgeMap.get(edgeKey);
          he.twin = twin;
          twin.twin = he;
        } else {
          edgeMap.set(edgeKey, he);
        }
      }
    }
  }

  // Smooth normals for all vertices
  smoothNormals() {
    for (const vertex of this.vertices) {
      let normalSum = { x: 0, y: 0, z: 0 };
      let count = 0;

      // Iterate through half-edges originating from this vertex
      let he = vertex.halfEdge;
      do {
        if (he.face) {
          const faceNormal = he.face.getNormal();
          normalSum.x += faceNormal.x;
          normalSum.y += faceNormal.y;
          normalSum.z += faceNormal.z;
          count++;
        }
        he = he.next;
      } while (he !== vertex.halfEdge);

      // Average the normals
      if (count > 0) {
        vertex.normal = {
          x: normalSum.x / count,
          y: normalSum.y / count,
          z: normalSum.z / count,
        };
      }
    }
  }

  // assumes all faces are well-ordered triangles and returns an array of quads
  trisToQuads() {
    const quads = [];
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      if (face.halfEdge && face.halfEdge.next && face.halfEdge.next.next) {
        // Create a quad from the triangle
        const v1 = face.halfEdge.vertex;
        const v2 = face.halfEdge.next.vertex;
        const v3 = face.halfEdge.next.next.vertex;
        const v4 = face.halfEdge.prev.vertex; // Previous vertex to complete the quad

        quads.push([v1, v2, v3, v4]);
      }
    }
    return quads;
  }
}
