import { GLContext } from "../GL/GLContext.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";

export class Scene {
  constructor() {
    this.root = new SceneObject(); // Root node
    this.root.pickingColor = [0.0, 0.0, 0.0, 0.0]; // Default picking color
    this.root.name = "(root)";
    this.camera = new Camera(); // Or camera component on a SceneObject
  }

  add(object) {
    this.root.addChild(object);
  }

  remove(object) {
    const index = this.root.children.indexOf(object);
    if (index !== -1) {
      this.root.children.splice(index, 1);
    }
  }

  getHierarchyList(skipRoot = false) {
    // returns the encapsulated list of objects in the scene
    const list = [];
    const traverse = (obj) => {
      if (!skipRoot || obj !== this.root) {
        list.push(obj);
      }
      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(this.root);
    return list;
  }
}
