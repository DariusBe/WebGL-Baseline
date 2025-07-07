import { Edge } from "./Edge.js";

export class Vertex {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.halfEdge = null; // One of the half-edges emanating from this vertex
    this.texCoord = null; // Texture coordinates
    this.normal = null; // Vertex normal
    this.color = null; // Vertex color
  }

  // Get all adjacent vertices
  getAdjacentVertices() {
    const adjacent = [];
    let current = this.halfEdge;
    do {
      adjacent.push(current.twin.vertex);
      current = current.twin.next;
    } while (current !== this.halfEdge);
    return adjacent;
  }
}
