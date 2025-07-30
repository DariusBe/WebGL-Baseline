import { Utils } from "../Utils/Utils.js";
import "../../../gl-matrix-min.js";

/**
 * GLContext singleton class to manage WebGL2 context, shaders, and global uniforms

 */
export class GLContext {
  // Singleton instance of GLContext
  static instance = null;

  static getInstance(context = "webgl-canvas") {
    if (!GLContext.instance) {
      GLContext.instance = new GLContext(context);
    }
    return GLContext.instance;
  }

  /* MEMBERS */
  gl;
  shaderList = new Map(); // Map of shader names to Shader objects
  canvas;
  sliderVal = 0.6;
  inputs = [];
  tick = 0.0;
  timestep = 1.0; // 60 FPS
  stats = {};
  verbosityLevel = 0; // 0: no output, 1: errors, 2: warnings, 3: info, 4: debug

  // global Uniform Buffer Object
  globalUniformBuffer;
  globalUniformBindingPoint = 0;
  globalUniformsBlock;
  globalUniformData;
  globalUniformLocation = {};

  // global uniforms
  uProjection;
  uView;
  uResolution;
  uTime = 5.0;
  uShowCursor;
  uMouse;
  uSelected;

  /*
  // uniform binding index = 0
  layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
    bool uSelected;
  };  
  */

  // perspective matrices
  lookAt;
  ortho;
  perspective;

  /*   * Constructor
   * @param {string} context - the id of the canvas element to use for WebGL2 context
   * @param {number} verbosityLevel - the level of verbosity for logging (0: none, 1: errors, 2: warnings, 3: info, 4: debug)
   */
  constructor(context = "webgl-canvas", verbosityLevel = 1) {
    // initialize the canvas and WebGL2 context
    // set gl context to use MSAA
    this.canvas = document.getElementById(context);
    if (!this.canvas) {
      throw new Error("No canvas found with id: " + context);
    }
    // powerPreference: 'high-performance', 'low-power', 'default'
    this.gl = canvas.getContext("webgl2", {
      antialias: true,
      powerPreference: "default",
    });

    if (!this.gl) {
      throw new Error("WebGL2 not supported");
    }

    // enable WebGL2 extensions for float textures and blending
    this.gl.getExtension("EXT_color_buffer_float"); // enable float textures
    this.gl.getExtension("EXT_float_blend"); // enable float blending
    // enable highest quality derivatives
    this.gl.getExtension("EXT_shader_texture_lod"); // enable texture LOD
    this.gl.getExtension("OES_standard_derivatives"); // enable derivatives

    // get HTML stats element
    this.stats = {
      cycle: document.querySelector(".stats .cycle"),
      fps: document.querySelector(".stats .fps"),
      t0: performance.now(),
    };
    if (!this.stats.cycle || !this.stats.fps) {
      throw new Error("No stats element found");
    } else {
      this.stats.cycle.innerHTML = "0";
      this.stats.fps.innerHTML = "0";
    }

    console.groupCollapsed("WebGL2 context created");

    if (this.verbosityLevel >= 3) {
      this.listContextStats();
    }
    console.log(
      "With canvas of size",
      this.canvas.width,
      "x",
      this.canvas.height,
      "and power preference",
      this.gl.getContextAttributes().powerPreference
    );

    // set model, view, and projection matrices
    this.uView = new glMatrix.mat4.create();
    this.uProjection = new glMatrix.mat4.create();
    this.lookAt = glMatrix.mat3.fromValues(
      0,
      0,
      4, // viewer's position (4 units away from center)
      0,
      0,
      0, // position viewer is looking at
      0,
      1,
      0 // up-axis);
    );
    this.ortho = new glMatrix.mat3.create();
    this.perspective = new glMatrix.mat3.create();

    // initialize global uniforms
    this.fillGlobalUniformBuffer();
    this.prepareGlobalUniforms();
    this.preparePerspective();

    // set up global uniforms
    this.cameraTransform();
    this.updateGlobalUniform("uView", this.uView);
    this.updateGlobalUniform("uProjection", this.uProjection);

    // set up event listeners
    // this.canvas.addEventListener("click", this.onclick);
    this.canvas.addEventListener("touchmove", this.touchmove);
    this.canvas.addEventListener("mousemove", this.onmousemove);
    window.addEventListener("resize", this.onresize);

    console.groupEnd();
  }

  /**
   * Sets up the glViewport to have a perspective based on uView and uProjection
   * @param {glMatrix.mat3} lookAtMatrix An optional 3-dimensional lookAt-matrix (otherwise default)
   */
  preparePerspective = (lookAtMatrix = this.lookAt) => {
    const row1 = new Float32Array([
      lookAtMatrix[0],
      lookAtMatrix[1],
      lookAtMatrix[2],
    ]);
    const row2 = new Float32Array([
      lookAtMatrix[3],
      lookAtMatrix[4],
      lookAtMatrix[5],
    ]);
    const row3 = new Float32Array([
      lookAtMatrix[6],
      lookAtMatrix[7],
      lookAtMatrix[8],
    ]);

    glMatrix.mat4.lookAt(
      this.uView,
      row1, // viewer's position (4 units away from center)
      row2, // position viewer is looking at
      row3 // up-axis
    );

    const aspectRatio = this.canvas.width / this.canvas.height;
    // args: in_matrix, fovy (vertical FoV in rad, smaller --> 'tele'), aspect_ratio, near, far (resp. distances of camera to near/far planes)
    glMatrix.mat4.perspective(
      this.uProjection,
      Math.PI / 1.5, // 90 degrees --> PI = 180, PI/1.5 = 120, PI/2 = 90 deg...
      aspectRatio,
      0.01,
      8
    );

    glMatrix.mat4.ortho(
      this.uProjection,
      // perspective defined as a bounding box
      // distance to.. left, right, bottom, top, near, far plane
      -1,
      1,
      -1,
      1,
      0,
      5 // bounding box as a unit cube that is stretched by factor 5 along z axis
    );
  };
  cameraTransform = () => {
    // glMatrix.mat4.rotate(this.uView, this.uView, 0.025, [0, 0.53, 0.25]);
    // glMatrix.mat4.scale(this.uView, this.uView, [0.999, 0.999, 0.999]);
  };
  /* EVENT HANDLERS*/
  // click event handler
  onclick = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    // visible viewport
    const rect = this.canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    // let mouseY = Math.floor(rect.bottom - e.clientY); // flip y-axis
    let mouseY = e.clientY - rect.top; // flip y-axis

    this.uMouse = new Float32Array([mouseX, mouseY, pressedButton]);

    this.updateGlobalUniform("uMouse", this.uMouse);
  };
  touchmove = (e) => {
    console.log(this.canvas.width, this.canvas.height);
    // visible viewport
    const rect = this.canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    // let mouseY = Math.floor(rect.bottom - e.clientY); // flip y-axis
    let mouseY = e.clientY - rect.top; // flip y-axis

    this.uMouse = new Float32Array([mouseX, mouseY, pressedButton]);

    this.updateGlobalUniform("uMouse", mouse);
  };

  onmousemove = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;

    // visible viewport
    const rect = this.canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    // let mouseY = Math.floor(rect.bottom - e.clientY); // flip y-axis
    let mouseY = e.clientY - rect.top; // flip y-axis

    this.uMouse = new Float32Array([mouseX, mouseY, pressedButton]);

    this.updateGlobalUniform("uMouse", this.uMouse);
  };
  touchmove = (e) => {
    console.log(this.canvas.width, this.canvas.height);

    e.preventDefault(); // prevent scrolling
    var touch = e.touches[0]; // get first touch point
    // update mouse uniform
    const pressedButton = 1.0;
    const mouse = new Float32Array([
      touch.clientX,
      touch.clientY,
      pressedButton,
    ]);

    this.updateGlobalUniform("uMouse", mouse);
  };
  onresize = () => {
    const shaderList = this.shaderList;
    const gl = this.gl;

    window.innerWidth = canvas.width;
    window.innerHeight = canvas.height;
    canvas.width = window.innerWidth;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    for (const shader of shaderList) {
      if (!shader.program) continue;
      gl.useProgram(shader.program);
      gl.uniform2fv(
        gl.getUniformLocation(shader.program, "uResolution"),
        new Float32Array([window.innerWidth, window.innerHeight])
      );
    }
  };

  /**
   * List the capabilities of the WebGL context
   */
  listContextStats = () => {
    const gl = this.gl;
    // check for MSAA support

    const msaa = this.gl.getContextAttributes().antialias;
    const stats = {
      Context: [
        {
          Renderer: gl.getParameter(gl.RENDERER),
          Version: gl.getParameter(gl.VERSION),
          ShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          powerPreference: gl.getContextAttributes().powerPreference,
        },
      ],
      Limitations: [
        {
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
          maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
          maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          maxVertexUniformVectors: gl.getParameter(
            gl.MAX_VERTEX_UNIFORM_VECTORS
          ),
          maxFragmentUniformVectors: gl.getParameter(
            gl.MAX_FRAGMENT_UNIFORM_VECTORS
          ),
          maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          maxMSAASamples: gl.getParameter(gl.MAX_SAMPLES),
        },
      ],
    };
    console.groupCollapsed("WebGL Context Stats");
    for (const [title, list] of Object.entries(stats)) {
      console.groupCollapsed(title);
      for (const entry of list) {
        for (const [key, value] of Object.entries(entry)) {
          console.log(key + ":", value);
        }
      }
      console.groupEnd();
    }
    console.groupCollapsed("MSAA");
    console.log("MSAA active:", msaa);
    console.groupEnd();
    console.groupEnd();
  };

  /**
   * Initialize the global uniform buffer with default values
   * @param {boolean} verbose - whether to print the buffer layout to console
   */
  fillGlobalUniformBuffer = (verbose = false) => {
    this.globalUniformData = new Float32Array(16 + 16 + 2 + 1 + 1 + 3 + 5); //
    /** Buffer Layout:
     * populate buffer with data
     *  1) mat4 uProjection; == 4 * 4 == 16 elements in one chunk
     *  2) mat4 uView; == 4 * 4 == 16 elements in two chunks
     *  3) vec2 uResolution; == 2 elements in chunk
     *  4) uniform float uTime; == 1 element in chunk
     *  5) uniform bool uShowCursor; == 1 element in chunk
     *  6) uniform vec3 uMouse; == 3 elements in chunk
     *
     *
     *  [1][1][1][1]  // uProjection -> 0...15
     *    ...
     *    ...
     *    ...
     *  [2][2][2][2] // uView -> 16...31
     *    ...
     *    ...
     *    ...
     *  [3][3]-[4]-[5] // uResolution -> 32..33, uTime -> 34, uShowCursor -> 35
     *  [6][6][6]-[P] // uMouse -> 36..38, Padding to 40
     */
    const offsets = [0, 16, 32, 34, 35, 36];

    this.uResolution = new Float32Array([
      this.canvas.width,
      this.canvas.height,
    ]);

    this.uTime = new Float32Array([0.0]);
    this.uShowCursor = new Float32Array([0.0]);
    this.uMouse = new Float32Array([-1.0, -2.0, 0.0]);

    const chunk1 = this.uProjection;
    const chunk2 = this.uView;

    this.globalUniformLocation = {
      uProjection: offsets[0],
      uView: offsets[1],
      uResolution: offsets[2],
      uTime: offsets[3],
      uShowCursor: offsets[4],
      uMouse: offsets[5],
    };

    this.globalUniformData.set(chunk1, offsets[0]);
    this.globalUniformData.set(chunk2, offsets[1]);
    this.globalUniformData.set(this.uResolution, offsets[2]);
    this.globalUniformData.set(this.uTime, offsets[3]);
    this.globalUniformData.set(this.uShowCursor, offsets[4]);
    this.globalUniformData.set(this.uMouse, offsets[5]);
    if (verbose) {
      console.groupCollapsed(
        "Global Uniform Buffer, Length:",
        this.globalUniformData.length
      );
      console.log(
        "uProjection",
        "[Positions 0-15]",
        "\n",
        Utils.printMatrix(this.globalUniformData.slice(0, 16), 4)
      );
      console.log(
        "uView",
        "[Positions 16-31]",
        "\n",
        Utils.printMatrix(this.globalUniformData.slice(16, 32), 4)
      );
      console.log(
        "uResolution",
        "[Positions 48-49]\n",
        Utils.printMatrix(this.globalUniformData.slice(48, 50), 2, 1)
      );
      console.log(
        "uTime",
        "[Position 50]\n",
        Utils.printMatrix(this.globalUniformData.slice(50, 51), 1, 1)
      );
      console.log(
        "uShowCursor",
        "[Position 51]\n",
        Utils.printMatrix(this.globalUniformData.slice(51, 52), 1, 1)
      );
      console.log(
        "uMouse",
        "[Positions 52-55]\n",
        Utils.printMatrix(this.globalUniformData.slice(52, 55), 3, 1) + "\n",
        Utils.printMatrix(this.globalUniformData.slice(55, 56), 1, 1),
        "(Pad)"
      );

      console.log(
        "Buffer Layout:\n",
        Utils.printMatrix(this.globalUniformData, 4, 14)
      );
      console.groupEnd();
    }
  };

  /**
   * Update the global uniform buffer with new values
   * @param {string} uniform - the uniform to update
   * @param {number} value - the value to update the uniform with
   * @returns {void}
   */
  updateGlobalUniform = (uniform, value) => {
    const gl = this.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.globalUniformBuffer);
    var offset = this.globalUniformLocation[uniform];
    if (value instanceof Array || value instanceof Float32Array) {
      value = new Float32Array(value);
    } else if (typeof value === "number") {
      value = new Float32Array([value]);
    }
    if (uniform === "uSelected") {
      console.error(
        "Updating global uniform:",
        uniform,
        "at offset:",
        offset,
        "value:",
        value
      );
      return;
    }
    const BYTE = 4;
    this.globalUniformData.set(value, offset);
    gl.bufferSubData(gl.UNIFORM_BUFFER, offset * BYTE, value);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  };

  /**
   * Adds a shader to the glContext shaderList and associates it with the global uniform buffer
   * @param {Shader} shader - the shader to associate with the global uniform buffer
   * @returns {void}
   */
  setShaderGlobal = (shader) => {
    this.shaderList.set(shader.name, shader);
    console.info("Setting shader global:", shader.name);
    this.prepareGlobalUniforms();
  };

  /**
   * Prepares the global uniforms for each shader in the shaderList
   * @returns {void}
   */
  prepareGlobalUniforms = () => {
    const gl = this.gl;

    // set uniform block binding point for each shader
    for (const shader of this.shaderList.values()) {
      gl.uniformBlockBinding(
        shader.program,
        gl.getUniformBlockIndex(shader.program, "GlobalUniforms"),
        this.globalUniformBindingPoint
      );
    }

    this.globalUniformBuffer = gl.createBuffer();
    // create associated between index = 0 and uniform buffer
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      this.globalUniformBindingPoint,
      this.globalUniformBuffer
    );

    gl.bufferData(gl.UNIFORM_BUFFER, this.globalUniformData, gl.DYNAMIC_DRAW);
  };

  /**
   * Returns the location of the global uniform block in the shader
   * @param {Shader} shader - the shader to get the global uniform block location from
   * @returns {Object|null} - the block index, size, and binding point of the global uniform block, or null if not found
   */
  getGlobalUniformBlockLocation = (shader) => {
    const gl = this.gl;
    const blockIndex = gl.getUniformBlockIndex(
      shader.program,
      "GlobalUniforms"
    );
    if (blockIndex === -1) {
      console.error(
        "Uniform block 'GlobalUniforms' not found in shader",
        shader.name
      );
      return null;
    }
    const blockSize = gl.getActiveUniformBlockParameter(
      shader.program,
      blockIndex,
      gl.UNIFORM_BLOCK_DATA_SIZE
    );
    if (blockSize === -1) {
      console.error(
        "Uniform block 'GlobalUniforms' has no data size in shader",
        shader.name
      );
      return null;
    }
    const blockBinding = gl.getUniformBlockParameter(
      shader.program,
      blockIndex,
      gl.UNIFORM_BLOCK_BINDING
    );
    if (blockBinding === -1) {
      console.error(
        "Uniform block 'GlobalUniforms' has no binding in shader",
        shader.name
      );
      return null;
    }
    console.log(
      "Uniform block 'GlobalUniforms' in shader",
      shader.name,
      "has size",
      blockSize,
      "and binding",
      blockBinding
    );
    return {
      blockIndex,
      blockSize,
      blockBinding,
    };
  };

  /**
   * Updates the global uniforms in the uniform buffer
   * @returns {void}
   */
  updateUniforms() {
    this.tick += this.timestep;
    this.updateGlobalUniform("uTime", this.tick);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.globalUniformBuffer);
    this.updateGlobalUniform("uTime", this.tick);
    this.updateGlobalUniform("uView", this.uView);
    this.updateGlobalUniform("uProjection", this.uProjection);

    // for (const shader of this.shaderList) {
    //   if (this.hasSliderChanged) {
    //     const kernel = Utils.gaussKernel1D(kernelSize, sigma, true);
    //     blurShader.updateUniform("uKernel", "1fv", kernel);
    //     blurShader.updateUniform("uKernelSize", "1i", kernelSize);
    //     this.hasSliderChanged = false;
    //   }
    // }
    // if (this.hasCheckboxChanged) {
    //   topoShader.updateUniform("uCheckbox", "bool", checkbox.checked);
    //   this.hasCheckboxChanged = false;
    // }

    // this.gl.useProgram(null);

    const cycle = Math.floor(this.tick / this.timestep);
    const t0 = this.stats.t0 / 1000; // convert to seconds
    const t1 = performance.now() / 1000; // convert to seconds
    const tPassed = t1 - t0;
    const fps = (cycle / tPassed).toFixed(0);
    this.updateStats(cycle, fps);
  }

  /**
   * Updates the stats HTML elements with the current cycle and FPS
   * @param {number} cycle - the current cycle number
   * @param {number} fps - the current frames per second
   */
  updateStats = (cycle, fps) => {
    this.stats.cycle.innerHTML = cycle;
    this.stats.fps.innerHTML = fps;
  };

  /**
   * Returns the maximum number of samples for MSAA (Multisample Anti-Aliasing) supported by the device.
   * @returns {number} The maximum number of samples supported by the WebGL context
   */
  requestMSAAAvailability() {
    const samples = this.gl.getParameter(this.gl.MAX_SAMPLES);
    const formats = this.gl.getInternalformatParameter(
      this.gl.RENDERBUFFER,
      this.gl.RGBA16F,
      this.gl.SAMPLES
    );
    console.info(
      `Max MSAA samples supported: ${samples}, Available formats:`,
      formats
    );

    return samples;
  }

  /**
   * Start the animation loop by invoking *requestAnimationFrame()*
   * @param {function} job - a function to run on each frame (optional)
   */
  animate = (job = () => {}) => {
    const renderloop = () => {
      job();
      this.updateUniforms();
      requestAnimationFrame(renderloop);
    };
    requestAnimationFrame(renderloop);
  };
}
