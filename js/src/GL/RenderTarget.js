import { GLContext } from "../GL/GLContext.js";
import { Texture } from "../Shading/Texture.js";
import { UUID } from "../Utils/UUID.js";

export class RenderTarget {
  constructor(width, height, name, colorTexture) {
    this.gl = GLContext.getInstance().gl;
    this.framebuffer = this.gl.createFramebuffer();
    this.depthBuffer = this.gl.createRenderbuffer();
    this.colorTexture = colorTexture;
    this.width = width || 512; // Default width
    this.height = height || 512; // Default height

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.init();
  }

  init = () => {
    this.name = name || "RenderTarget_" + this.getUUID();
    const gl = this.gl;

    if (!this.colorTexture && !(this.colorTexture instanceof Texture)) {
      this.colorTexture = new Texture(
        "fboColorTexture_" + this.getUUID(),
        this.width,
        this.height
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.colorTexture.webGLTexture,
      0
    );

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      this.width,
      this.height
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depthBuffer
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(this.name, "is incomplete");
    }

    // unbind all buffers and textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  };

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
  }

  unbind() {
    const gl = this.gl;
    gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  equals = (other) => {
    return other instanceof RenderTarget && this.getUUID() === other.getUUID();
  };
}
