import { Utils } from "./Utils.js";
import "../../gl-matrix-min.js";

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
  uView;
  uProjection;
  uResolution;
  uTime = 5.0;
  uShowCursor;
  uMouse;

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
    // hint for fragment shader derivatives
    this.gl.hint(this.gl.FRAGMENT_SHADER_DERIVATIVE_HINT, this.gl.NICEST);

    // enable WebGL2 extensions for float textures and blending
    this.gl.getExtension("EXT_color_buffer_float"); // enable float textures
    this.gl.getExtension("EXT_float_blend"); // enable float blending
    this.gl.getExtension("OES_texture_float_nearest"); // enable linear filtering for float textures, alternative: nearest
    this.gl.getExtension("OES_texture_float"); // enable float textures

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
  onmousemove = (e) => {
    const shaderList = this.shaderList;
    const gl = this.gl;

    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    const padding = 0;

    // visible viewport
    const rect = this.canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top; // flip y-axis
    // normalize mouse coordinates to [0, 1] range
    if (mouseX < 0) mouseX = 0;
    if (mouseY < 0) mouseY = 0;
    if (mouseX > this.canvas.width) mouseX = this.canvas.width;
    if (mouseY > this.canvas.height) mouseY = this.canvas.height;

    const mouse = new Float32Array([
      mouseX,
      mouseY * -1 + this.canvas.height,
      pressedButton,
    ]);

    this.updateGlobalUniform("uMouse", mouse);
  };
  touchmove = (e) => {
    const shaderList = this.shaderList;
    const gl = this.gl;
    console.log(this.canvas.width, this.canvas.height);

    e.preventDefault(); // prevent scrolling
    var touch = e.touches[0]; // get first touch point
    // update mouse uniform
    const pressedButton = 1.0;
    const mouse = new Float32Array([
      touch.clientX / this.canvas.width,
      1 - touch.clientY / this.canvas.height,
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
    this.globalUniformData = new Float32Array(16 + 16 + 2 + 1 + 1 + 4); //
    /** Buffer Layout:
     * populate buffer with data
     *  1) mat4 uProjection; == 4 * 4 == 16 elements in one chunk
     *  2) mat4 uView; == 4 * 4 == 16 elements in two chunks
     *  4) uniform vec2 uResolution; == 2 elements in chunk
     *  5) uniform float uTime; == 1 element in chunk
     *  6) uniform bool uShowCursor; == 1 element in chunk
     *  7) uniform vec3 uMouse; == 3 elements in chunk
     *  [1][1][1][1] x 4
     *  [2][2][2][2] x 4
     *  [3][3]-[4]-[5]
     *  [6][6][6]-[Pad]
     */
    const offsets = [0, 16, 32, 34, 35, 36];

    this.uResolution = new Float32Array([
      this.canvas.width,
      this.canvas.height,
    ]);

    this.uTime = new Float32Array([0.0]);
    this.uShowCursor = new Float32Array([0.0]);
    const padding = new Float32Array([0.0]);
    this.uMouse = new Float32Array([-1.0, -2.0, 0.0, padding]);

    const chunk1 = this.uProjection;
    const chunk2 = this.uView;

    this.globalUniformLocation = {
      uProjection: 0,
      uView: 16,
      uResolution: 32,
      uTime: 34,
      uShowCursor: 35,
      uMouse: 36,
    };

    this.globalUniformData.set(chunk1, 0);
    this.globalUniformData.set(chunk2, 16);
    this.globalUniformData.set(this.uResolution, 32);
    this.globalUniformData.set(this.uTime, 34);
    this.globalUniformData.set(this.uShowCursor, 35);
    this.globalUniformData.set(this.uMouse, 36);

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

  showMatrixGuides = () => {
    console.groupCollapsed("Matrix Guides");
    console.log("uProjection\n", Utils.printMatrix(this.uProjection, 4, 4, 2));
    console.log("uView\n", Utils.printMatrix(this.uView, 4, 4, 2));

    console.info(
      "A View matrix rotated by 45 degrees about the z-axis looks like this:\n"
    );
    const rotationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.rotateZ(rotationMatrix, rotationMatrix, Math.PI / 4);
    console.log(
      "Rotation Matrix:\n",
      Utils.printMatrix(rotationMatrix, 4, 4, 2)
    );

    // listen to keypress 'r':
    document.addEventListener("keypress", (e) => {
      var test = glMatrix.mat4.create();
      if (e.key === "r") {
        glMatrix.mat4.mul(this.uView, rotationMatrix, this.uView);
        this.updateGlobalUniform("uView", this.uView);
      }
      if (e.key === "p") {
        console.log("rotated uView\n", Utils.printMatrix(this.uView, 4, 4, 8));
      }
    });
    console.groupEnd();
  };

  updateUniforms() {
    this.tick += this.timestep;
    this.updateGlobalUniform("uTime", this.tick);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.globalUniformBuffer);
    this.updateGlobalUniform("uTime", this.tick);
    this.updateGlobalUniform("uView", this.uView);
    this.updateGlobalUniform("uProjection", this.uProjection);

    for (const shader of this.shaderList) {
      if (this.hasSliderChanged) {
        const kernel = Utils.gaussKernel1D(kernelSize, sigma, true);
        blurShader.updateUniform("uKernel", "1fv", kernel);
        blurShader.updateUniform("uKernelSize", "1i", kernelSize);
        this.hasSliderChanged = false;
      }
    }
    if (this.hasCheckboxChanged) {
      topoShader.updateUniform("uCheckbox", "bool", checkbox.checked);
      this.hasCheckboxChanged = false;
    }

    this.gl.useProgram(null);

    const cycle = Math.floor(this.tick / this.timestep);
    const t0 = this.stats.t0 / 1000; // convert to seconds
    const t1 = performance.now() / 1000; // convert to seconds
    const tPassed = t1 - t0;
    const fps = (cycle / tPassed).toFixed(0);
    this.updateStats(cycle, fps);
  }

  updateStats = (cycle, fps) => {
    this.stats.cycle.innerHTML = cycle;
    this.stats.fps.innerHTML = fps;
  };

  animate = (job = () => {}) => {
    const renderloop = () => {
      job();
      this.updateUniforms();
      requestAnimationFrame(renderloop);
    };
    requestAnimationFrame(renderloop);
  };
}
