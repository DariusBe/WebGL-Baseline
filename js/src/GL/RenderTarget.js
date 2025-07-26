import { GLContext } from "../GL/GLContext.js";
import { Texture } from "../Shading/Texture.js";
import { UUID } from "../Utils/UUID.js";

export class RenderTarget {
  constructor(width, height, name, targetTexture, multisample = true) {
    this.gl = GLContext.getInstance().gl;
    this.framebuffer = this.gl.createFramebuffer();
    this.depthBuffer = this.gl.createRenderbuffer();
    this.targetTexture = targetTexture;
    this.width = width || 512; // Default width
    this.height = height || 512; // Default height
    this.multisample = multisample;

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.name = name || "FBO_" + this.getUUID();
    this.framebuffer.name = this.name; // Set name for debugging
    this.init();
  }

  init = () => {
    const gl = this.gl;

    if (!this.targetTexture || !(this.targetTexture instanceof Texture)) {
      this.targetTexture = new Texture(
        this.name + "_ColorTexture",
        null,
        this.width,
        this.height,
        "RGBA16F",
        "LINEAR",
        "RGBA",
        "FLOAT",
        "CLAMP_TO_EDGE"
      );
    }

    // Setup the regular framebuffer (resolve target) first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.targetTexture.webGLTexture,
      0
    );

    // depth / stencil buffer for regular framebuffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
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
      this.depthBuffer
    );

    // Check regular framebuffer completeness
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(this.name, "regular framebuffer is incomplete");
    }

    // If multisampling is enabled, create a multisampled framebuffer
    if (this.multisample) {
      const samples = this.requestMSAAAvailability();
      if (samples <= 0) return;

      console.info(
        `Creating multisampled framebuffer with ${samples} samples.`
      );

      // Create MSAA framebuffer and attachments
      this.msaFBO = gl.createFramebuffer();
      this.msaaColorBuffer = gl.createRenderbuffer();
      this.msaaDepthBuffer = gl.createRenderbuffer();

      // MSAA color attachment setup
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColorBuffer);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        samples,
        gl.RGBA16F,
        this.width,
        this.height
      );

      // MSAA depth attachment setup
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaDepthBuffer);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        samples,
        gl.DEPTH_COMPONENT16,
        this.width,
        this.height
      );

      // Bind and setup MSAA framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaFBO);
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.RENDERBUFFER,
        this.msaaColorBuffer
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        this.msaaDepthBuffer
      );

      // Check MSAA framebuffer completeness
      if (
        gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
      ) {
        console.error(this.name, "MSAA framebuffer is incomplete");
      }
    }

    // unbind all buffers and textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  };

  bind() {
    const gl = this.gl;
    if (this.multisample) {
      // If multisampling is enabled, bind the multisampled framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFBO);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
  }

  unbind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  equals = (other) => {
    return other instanceof RenderTarget && this.getUUID() === other.getUUID();
  };

  readbackPixelsBlocking(
    x = 0,
    y = 0,
    width = this.width,
    height = this.height
  ) {
    const gl = this.gl;

    let data = new Float32Array(width * height * 4); // RGBA format

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    // get fbo information
    const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
    const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);

    // with x,y defining an rectangle in pixels, y is from bottom to top
    // and width, height defining the size of the rectangle
    gl.readPixels(x, y, width, height, format, type, data);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data;
  }

  async readbackPixelsNonBlocking(
    x = 0,
    y = 0,
    width = this.width,
    height = this.height,
    PBO = null
  ) {
    const gl = this.gl;

    // Create a Pixel Buffer Object (PBO) for asynchronous readback
    const pbo = PBO || gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);

    // Allocate buffer storage for the PBO
    let data = new Float32Array(width * height * 4); // RGBA format

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);

    // get fbo information
    const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
    const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);

    // with x,y defining an rectangle in pixels, y is from bottom to top
    // and width, height defining the size of the rectangle
    gl.readPixels(x, y, width, height, format, type, 0);

    waitForResponse().then(() => {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data;
  }

  msaaFBOCopyOver() {
    const gl = this.gl;

    if (!this.multisample) {
      console.warn("msaaFBOCopyOver called on non-MSAA framebuffer");
      return;
    }

    // Bind the multisampled framebuffer as read source
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFBO);
    // Bind the regular framebuffer as draw destination
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);

    // Blit the color buffer from MSAA to regular framebuffer
    gl.blitFramebuffer(
      0,
      0,
      this.width,
      this.height, // source rectangle
      0,
      0,
      this.width,
      this.height, // destination rectangle
      gl.COLOR_BUFFER_BIT, // buffer mask
      gl.NEAREST // filter
    );

    // Also blit the depth buffer if you need it
    gl.blitFramebuffer(
      0,
      0,
      this.width,
      this.height, // source rectangle
      0,
      0,
      this.width,
      this.height, // destination rectangle
      gl.DEPTH_BUFFER_BIT, // buffer mask
      gl.NEAREST // filter (must be NEAREST for depth)
    );

    // Unbind framebuffers
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  requestMSAAAvailability() {
    const gl = GLContext.getInstance().gl;
    const samples = gl.getParameter(gl.MAX_SAMPLES);
    const formats = gl.getInternalformatParameter(
      gl.RENDERBUFFER,
      gl.RGBA16F,
      gl.SAMPLES
    );
    console.info(
      `Max MSAA samples supported: ${samples}, Available formats:`,
      formats
    );

    return samples;
  }
}
