import { Vertex } from "./Vertex.js";

export class Edge {
  /**
   * Represents an edge in a polygon defined by two vertices.
   * @param {Vertex} v1 - The first vertex of the edge.
   * @param {Vertex} v2 - The second vertex of the edge.
   */
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
  }
}
