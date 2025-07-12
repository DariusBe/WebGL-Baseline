import { GLContext } from "../GL/GLContext.js";
import { Utils } from "../Utils/Utils.js";
import { UUID } from "../Utils/UUID.js";
import "../../../gl-matrix-min.js";

export class Texture {
  /**
   * Creates a new texture object.
   *
   * @param {string} name - The name of the texture.
   * @param {Image|ImageBitmap|HTMLCanvasElement} imageMap - The image or canvas to use as the texture source.
   * @param {number} width - The width of the texture.
   * @param {number} height - The height of the texture.
   * @param {string} internalFormat - A GLenum specifying the color components in the texture (default: "RGBA16F").
   * @param {string} interpolation - The interpolation method for the texture (default: "LINEAR").
   * @param {string} texelFormat - A GLenum specifying the format of the texel data (default: "RGBA").
   * * The texelFormat should be one of the following: https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
   * @param {string} texelType - A GLenum specifying the data type of the texel data (default: "FLOAT").
   * @param {string} clamping - The clamping method for the texture (default: "CLAMP_TO_EDGE").
   */
  constructor(
    name = "newTexture",
    imageMap,
    width = 512,
    height = 512,
    internalFormat = "RGBA16F",
    interpolation = "LINEAR",
    texelFormat = "RGBA",
    texelType = "FLOAT",
    clamping = "CLAMP_TO_EDGE"
  ) {
    const gl = GLContext.getInstance().gl;
    this.webGLTexture = gl.createTexture();
    this.name = name;
    this.imageMap = imageMap;
    this.width = width;
    this.height = height;
    this.format = internalFormat;
    this.texelFormat = texelFormat;
    this.texelType = texelType;
    this.interpolation = interpolation;
    this.clamping = clamping;

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.init();
  }

  init = () => {
    const gl = GLContext.getInstance().gl;
    // flip image vertically

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.webGLTexture);

    // rotate texture by 90 degrees if not specified otherwise
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    if (this.imageMap == null) {
      console.info(
        "No image provided for texture:",
        this.name,
        "using default pink texture."
      );
      this.imageMap = Utils.getPinkStartTexture(this.width, this.height);
    }

    // args: target, mipmap level, internal format, width, height, border (always 0), format, type, data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl[this.format],
      this.width,
      this.height,
      0,
      gl[this.texelFormat],
      gl[this.texelType],
      this.imageMap
    ); // mipmapping
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl[this.interpolation]
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl[this.interpolation]
    );

    // set to non-repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.clamping]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.clamping]);

    gl.bindTexture(gl.TEXTURE_2D, null);

    console.info(
      "Prepared texture:",
      this.webGLTexture,
      "with size:",
      this.width,
      this.height
    );
  };

  bindTexture = (unit = 0) => {
    const gl = GLContext.getInstance().gl;
    gl.activeTexture(gl["TEXTURE" + unit]);
    gl.bindTexture(gl.TEXTURE_2D, this.webGLTexture);
  };

  unbindTexture = () => {
    const gl = GLContext.getInstance().gl;
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  equals = (other) => {
    return other instanceof Texture && this.getUUID() === other.getUUID();
  };
}
