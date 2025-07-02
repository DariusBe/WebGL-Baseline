import { GLContext } from "./GLContext.js";

export class RenderTarget {
  constructor(width, height, options = {}) {
    this.gl = GLContext.getInstance().gl;
    this.framebuffer = this.gl.createFramebuffer();
    this.colorTexture = this.createColorAttachment(width, height);
    this.depthBuffer = this.createDepthAttachment(width, height);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.colorTexture,
      0
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER,
      this.depthBuffer
    );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  createColorAttachment(width, height) {
    const gl = this.gl;

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  createDepthAttachment(width, height) {
    const gl = this.gl;
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );
    return rb;
  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
  }

  unbind() {
    const gl = this.gl;
    gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
