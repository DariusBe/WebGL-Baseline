import { GLContext } from "../GL/GLContext.js";
import { SceneObject } from "./SceneObject.js";
import { Camera } from "./Camera.js";

export class Scene {
  constructor() {
    this.root = new SceneObject(); // Root node
    this.root.pickingColor = [-1.0, -1.0, -1.0, -1.0]; // Default picking color for root
    this.root.name = "(root)";
    // this.camera = new Camera(); // Or camera component on a SceneObject
    this.scenegraph = new Map();
    this.scenegraph.set(this.root.name, this.root);
  }

  add(object) {
    this.scenegraph.set(object.name, object);
    this.root.addChild(object);
  }

  remove(object) {
    this.root.removeChild(object);
    // const index = this.root.children.indexOf(object);
    // if (index !== -1) {
    //   this.root.children.splice(index, 1);
    // }
  }

  // getHierarchyList(skipRoot = false) {
  //   // returns the encapsulated list of objects in the scene
  //   const list = [];
  //   const traverse = (obj) => {
  //     if (!skipRoot || obj !== this.root) {
  //       list.push(obj);
  //     }
  //     for (const [childName, child] of obj.children) {
  //       traverse(child);
  //     }
  //   };

  //   traverse(this.root);
  //   return list;
  // }

  // createCamera() {
  //   this.camera = new Camera();
  //   this.add(this.camera);
  // }

  getHierarchyList(skipRoot = false) {
    // returns the encapsulated list of objects in the scene
    const list = new Map();
    const traverse = (obj) => {
      if (!skipRoot || obj !== this.root) {
        list.set(obj.name, obj);
      }
      for (const [childName, child] of obj.children) {
        traverse(child);
      }
    };

    traverse(this.root);
    return list;
  }

  printHierarchyList() {
    // console.warn(this.getHierarchyList());

    for (const [objName, obj] of this.scenegraph) {
      console.warn(objName, obj);
    }
  }

  createCamera() {
    this.camera = new Camera();
    this.add(this.camera);
  }

  createSceneObject(name) {
    const obj = new SceneObject(name);
    this.add(obj);
    return obj;
  }
}
