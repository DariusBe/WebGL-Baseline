import { Editor } from "./src/GUI/Editor.js";
import { SceneObject } from "./src/Scene/SceneObject.js";
import { Texture } from "./src/Shading/Texture.js";
import { Utils } from "./src/Utils/Utils.js";
import { Material } from "./src/Shading/Material.js";

const editor = new Editor();

// MARS
const mars = await SceneObject.createFromOBJ(
  "resources/models/planet.obj",
  "resources/models/planet.mtl"
);
mars.transform.setScale(0.1, 0.1, 0.1);
const marsTex = new Texture(
  "MarsTexture",
  await Utils.loadImage("resources/textures/Mars.jpg", 1440, 720),
  1440,
  720,
  "RGBA16F",
  "LINEAR",
  "RGBA",
  "FLOAT",
  "CLAMP_TO_EDGE"
);
const marsMaterial = new Material("MarsMaterial", null, null, marsTex);
mars.addMaterial(marsMaterial, true);
mars.solidMaterial = marsMaterial; // Set solid material
mars.activeMaterial = marsMaterial;
mars.name = "Mars";
editor.scene.add(mars);

// console.error(editor.scene.scenegraph);

editor.render();
