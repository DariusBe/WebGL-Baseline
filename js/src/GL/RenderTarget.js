import { GLContext } from "../GL/GLContext.js";
import { Texture } from "../Shading/Texture.js";
import { UUID } from "../Utils/UUID.js";

export class RenderTarget {
  /**
   * Creates a new RenderTarget instance.
   * @param {number} width - The width of the render target.
   * @param {number} height - The height of the render target.
   * @param {string} name - The name of the render target.
   * @param {Texture} targetTexture - The texture to be used as the color attachment.
   * @param {boolean} [multisample=true] - Whether to use multisampling for anti-aliasing, if supported by the context.
   * @param {boolean} [withPickingFramebuffer=false] - Whether to create an additional framebuffer for object picking.
   */
  constructor(
    width,
    height,
    name,
    targetTexture,
    multisample = true,
    withPickingFramebuffer = false
  ) {
    this.context = GLContext.getInstance();
    /** @type {WebGLRenderingContext} */
    this.gl = this.context.gl;
    this.framebuffer = this.gl.createFramebuffer();
    this.depthBuffer = this.gl.createRenderbuffer();
    this.targetTexture = targetTexture;

    const devicePixelRatio = window.devicePixelRatio || 1;
    this.width = width || this.gl.canvas.clientWidth * devicePixelRatio;
    this.height = height || this.gl.canvas.clientHeight * devicePixelRatio;
    this.multisample = multisample;
    this.withPickingFramebuffer = withPickingFramebuffer;

    // UUID handling
    const _uuid = UUID.generate();
    this.getUUID = () => {
      return _uuid;
    };

    this.name = name || "FBO_" + this.getUUID();
    this.framebuffer.name = this.name; // Set name for debugging
    this.init();
  }

  /**
   * Initializes the framebuffer and its attachments
   * This method sets up the color texture, depth buffer, and optionally a buffer for object picking.
   * * The framebuffer is bound to the default framebuffer (0) after initialization.
   * * In case of multisampling, it also sets up a multisampled framebuffer, if supported by the context.
   * * If a picking framebuffer is requested, it creates an additional texture **this.pickingTexture** for picking, attached to the framebuffer at COLOR_ATTACHMENT1.
   * @throws {Error} if the framebuffer is not complete
   */
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

    // If picking buffer is requested, create it
    if (this.withPickingFramebuffer) {
      // Create a second texture for picking
      this.pickingTexture = new Texture(
        this.name + "_PickingTexture",
        null,
        this.width,
        this.height,
        "RGBA16F",
        "LINEAR",
        "RGBA",
        "FLOAT",
        "CLAMP_TO_EDGE"
      );

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT1,
        gl.TEXTURE_2D,
        this.pickingTexture.webGLTexture,
        0
      );

      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); // 36065 is gl.COLOR_ATTACHMENT1
    } else {
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    }

    // Check regular framebuffer completeness
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(this.name, "regular framebuffer is incomplete");
    }

    // If multisampling is enabled, create a multisampled framebuffer
    if (this.multisample) {
      this.createMSAAFramebuffer();
    }

    // unbind all buffers and textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  };

  createMSAAFramebuffer = () => {
    const gl = this.gl;
    const samples = this.context.requestMSAAAvailability();
    if (samples <= 0) return;

    console.info(`Creating multisampled framebuffer with ${samples} samples.`);

    // Create MSAA framebuffer and attachments
    this.msaaFBO = gl.createFramebuffer();
    this.msaaColorBuffer = gl.createRenderbuffer();
    if (this.withPickingFramebuffer) {
      this.msaaPickingBuffer = gl.createRenderbuffer();
    }
    this.msaaDepthBuffer = gl.createRenderbuffer();

    // MSAA color attachment setup, using the same texture format as the regular framebuffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColorBuffer);
    gl.renderbufferStorageMultisample(
      gl.RENDERBUFFER,
      samples,
      gl.RGBA16F,
      this.width,
      this.height
    );

    // If picking framebuffer is requested, create a second MSAA renderbuffer target
    if (this.withPickingFramebuffer) {
      // MSAA picking attachment setup
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaPickingBuffer);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        samples,
        gl.RGBA16F,
        this.width,
        this.height
      );
    }

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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFBO);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.RENDERBUFFER,
      this.msaaColorBuffer
    );
    // If picking framebuffer is enabled, attach the picking renderbuffer to COLOR_ATTACHMENT1
    if (this.withPickingFramebuffer) {
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT1,
        gl.RENDERBUFFER,
        this.msaaPickingBuffer
      );
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    }
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.msaaDepthBuffer
    );

    // Check MSAA framebuffer completeness
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(this.name, "MSAA framebuffer is incomplete");
    }
  };

  /**
   * Binds the framebuffer for rendering
   * if multisampling is enabled, the MSAA framebuffer will be bound automatically
   * @returns {void}
   */
  bind() {
    const gl = this.gl;
    if (this.multisample) {
      // If multisampling is enabled, bind the multisampled framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFBO);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
  }

  /**
   * Unbinds the framebuffer, resetting to the default framebuffer
   * @returns {void}
   */
  unbind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Compares this RenderTarget with another RenderTarget with respect to their UUIDs
   * @param {RenderTarget} other - the other RenderTarget to compare with
   * @returns {boolean} true if the UUIDs match, false otherwise
   */
  equals = (other) => {
    return other instanceof RenderTarget && this.getUUID() === other.getUUID();
  };

  /**
   * Reads back pixels from the framebuffer - **blocking version**
   * This method reads pixels synchronously from the framebuffer and may lead to pipeline stalls.
   * @param {number} x - the x coordinate of the rectangle to read
   * @param {number} y - the y coordinate of the rectangle to read
   * @param {number} width - the width of the rectangle to read
   * @param {number} height - the height of the rectangle to read
   * @returns {Float32Array} the pixel data in RGBA format
   */
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

  /**
   * Reads back pixels from the framebuffer - **non-blocking version**
   * @param {number} x - the x coordinate of the rectangle to read
   * @param {number} y - the y coordinate of the rectangle to read
   * @param {number} width - the width of the rectangle to read
   * @param {number} height - the height of the rectangle to read
   * @param {WebGLBuffer|null} PBO - optional Pixel Buffer Object for asynchronous readback
   * @returns {Promise<Float32Array>} a promise that resolves with the pixel data in RGBA format
   */
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

  /**
   * Copies the MSAA framebuffer data to the regular framebuffer by blitting.
   * This method is used to resolve the multisampled data into a regular texture.
   * It is typically called after rendering to the MSAA framebuffer.
   * @returns {void}
   */
  msaaFBOCopyOver() {
    const gl = this.gl;

    if (!this.multisample) {
      console.warn("msaaFBOCopyOver called on non-MSAA framebuffer");
      return;
    }

    // Blitting Source:
    // Bind the multisampled framebuffer as READ_FRAMEBUFFER
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFBO);
    // Blitting Destination:
    // Bind the regular framebuffer as DRAW_FRAMEBUFFER
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);

    gl.readBuffer(gl.COLOR_ATTACHMENT0); // Read from the color attachment of the MSAA framebuffer
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]); // Draw to the color attachment of the regular framebuffer

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
      gl.NEAREST
    );

    // If we have an additional object picking texture, copy it as well
    if (this.withPickingFramebuffer) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFBO);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);

      gl.readBuffer(gl.COLOR_ATTACHMENT1); // Read from the picking texture
      gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1]); // Draw to the picking texture

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
        gl.NEAREST
      );
    }

    // Also blit the depth buffer if you need it
    // gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFBO);
    // gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);

    // gl.readBuffer(gl.DEPTH_ATTACHMENT); // Read from the depth attachment of the MSAA framebuffer
    // gl.drawBuffers([gl.DEPTH_ATTACHMENT0]); // Draw to the depth attachment of the
    // gl.blitFramebuffer(
    //   0,
    //   0,
    //   this.width,
    //   this.height, // source rectangle
    //   0,
    //   0,
    //   this.width,
    //   this.height, // destination rectangle
    //   gl.DEPTH_BUFFER_BIT, // buffer mask
    //   gl.NEAREST // filter (must be NEAREST for depth!)
    // );

    // Unbind framebuffers
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  readPickingAt(x, y) {
    let data = new Float32Array(4); // RGBA format

    if (!this.withPickingFramebuffer) {
      console.warn("No picking framebuffer available for reading.");
      return data;
    }
    // // read multisampled framebuffer if available
    // if (this.multisample) {
    //   this.msaaFBOCopyOver(); // Ensure MSAA data is copied over
    //   this.bind(); // Bind the regular framebuffer
    // } else {
    //   this.bind(); // Bind the regular framebuffer
    // }
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.readBuffer(gl.COLOR_ATTACHMENT1); // Read from the picking texture
    // console.log(
    //   "Picking at:",
    //   Number(x.toFixed(2)),
    //   Number(y.toFixed(2)),
    //   "from framebuffer:",
    //   this.name,
    //   "with picking texture:",
    //   this.pickingTexture.name,
    //   "of size:",
    //   this.pickingTexture.width,
    //   this.pickingTexture.height
    // );
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, data);

    return data;
  }
}
