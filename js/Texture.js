import { GLContext } from "./GLContext.js";
import { LegacyShader } from "./LegacyShader.js";
import { Utils } from "./Utils.js";
import "../../../gl-matrix-min.js";

export class Texture {
  constructor(glContext, name, imageMap, width = 512, height = 512) {
    this.glContext = glContext;
    this.gl = glContext.gl;
    this.name = name;
    this.image = imageMap;
    this.width = width;
    this.height = height;
  }
}
