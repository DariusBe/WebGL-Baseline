import { Edge } from "./Edge.js";

export class Face {
  constructor() {
    this.halfEdge = null;    // One of the half-edges bounding this face
    this.material = null;    // Material associated with this face
  }
  
  // Get all vertices of this face
  getVertices() {
    const vertices = [];
    let current = this.halfEdge;
    do {
      vertices.push(current.vertex);
      current = current.next;
    } while (current !== this.halfEdge);
    return vertices;
  }
}
