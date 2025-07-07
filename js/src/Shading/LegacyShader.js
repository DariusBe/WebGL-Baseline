import { Utils } from "../Utils/Utils.js";
import { GLContext } from "../GL/GLContext.js";
import { Attribute } from "../GL/Attribute.js";
import { Uniform } from "../GL/Uniform.js";

export class LegacyShader {
  glContext = GLContext.getInstance();
  gl;
  name;
  program;
  vaoList = [];
  vao;
  textureList = {};
  bufferList = [];
  fbo = [];
  tfVao = null;
  tfBufferSize = 0;
  tfBuffer;
  attributeList = [];
  AttributesPoolBuffer = null;
  uniformList = [];
  uniformBlockIndex = "GlobalUniforms";

  /**
   * Creates a new Shader object.
   * @param {WebGL2RenderingContext} gl The WebGL2 rendering context
   * @param {string} name The name of the shader program
   * @param {string} vertexShaderCode The vertex shader code
   * @param {string} fragmentShaderCode The fragment shader code
   * @param {Object} attributes An object containing the attributes as { attributeName: [location, [size, type, normalized, stride, offset], bufferData, separate] }
   * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
   * @param {Object} tf_description An object containing the transform feedback description as { TF_varyings=['vPoints'], TF_mode=gl.SEPARATE_ATTRIBS, TF_bufferSize=BUFFSIZE }
   * @param {boolean} verbose If true, the console will output detailed information about uniforms, attributes and transform feedback
   */
  constructor(
    name = "",
    vertexShaderCode,
    fragmentShaderCode,
    attributes = null,
    uniforms = null,
    tf_description = null
  ) {
    const verbosityLevel = GLContext.getInstance().verbosityLevel >= 3;
    this.gl = this.glContext.gl;
    this.name = name;
    this.program = this.prepareShaderProgram(
      vertexShaderCode,
      fragmentShaderCode,
      tf_description !== null ? tf_description : null
    );

    this.prepareUniform(uniforms);
    this.vao = this.prepareAttributes(attributes);
    this.vaoList.push(this.vao);
    if (tf_description !== null) {
      // seperate tf_description into args { TF_Attribute, TF_varyings: ['vPoints'], TF_mode: gl.SEPARATE_ATTRIBS, TF_buffer: TF_BUFF_1, TF_bufferSize: BUFFSIZE }
      const TF_attribute = tf_description.TF_attribute;
      const buffer = tf_description.TF_buffer;
      const bufferSize = tf_description.TF_bufferSize;
      this.prepareTransformFeedback(
        TF_attribute,
        buffer,
        bufferSize,
        "DYNAMIC_DRAW"
      );
    }
  }

  /**
   * Creates a shader program from vertex and fragment shader code
   * @param {String} vertexShaderCode A string containing the vertex shader code
   * @param {String} fragmentShaderCode A string containing the fragment shader code
   * @param {Object} tf_description An object containing the transform feedback description as { TF_varyings=['vPoints'], TF_mode=gl.SEPARATE_ATTRIBS, TF_bufferSize=BUFFSIZE }
   * @returns {WebGLProgram} A WebGLProgram object
   * @throws {Error} If the shader program cannot be created
   */
  prepareShaderProgram(vertexShaderCode, fragmentShaderCode, tf_description) {
    const gl = GLContext.getInstance().gl;
    const verbosityLevel = GLContext.getInstance().verbosityLevel;

    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    this.vertexShader.name = this.name + "VertShader";
    gl.shaderSource(this.vertexShader, vertexShaderCode);
    gl.compileShader(this.vertexShader);
    if (
      verbosityLevel > 0 &&
      !gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)
    ) {
      console.error(
        "Error compiling ",
        this.vertexShader.name,
        gl.getShaderInfoLog(this.vertexShader)
      );
      return;
    }

    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    this.fragmentShader.name = this.name + "FragShader";
    gl.shaderSource(this.fragmentShader, fragmentShaderCode);
    gl.compileShader(this.fragmentShader);
    if (
      verbosityLevel > 0 &&
      !gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)
    ) {
      console.error(
        "Error compiling ",
        this.fragmentShader.name,
        gl.getShaderInfoLog(this.fragmentShader)
      );
      return;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, this.vertexShader);
    gl.attachShader(shaderProgram, this.fragmentShader);

    // before linking, set up transform feedback varyings if enabled
    if (tf_description !== null) {
      const { TF_attribute, TF_varyings, TF_mode, TF_bufferSize } =
        tf_description;
      this.tfBufferSize = TF_bufferSize;
      if (verbosityLevel >= 3) {
        console.info(
          "Transform feedback enabled with varyings:",
          TF_varyings,
          "for attributes:",
          TF_attribute,
          "buffer size:",
          TF_bufferSize
        );
      }
      /* TF_mode: SEPARATE_ATTRIBS or INTERLEAVED_ATTRIBS:
       * SEPARATE_ATTRIBS: If multiple varyings are passed, each varying is written to a separate buffer object.
       * INTERLEAVED_ATTRIBS: All varyings are written to the same buffer object.
       */
      gl.transformFeedbackVaryings(shaderProgram, TF_varyings, TF_mode);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.tfBuffer);
    }

    gl.linkProgram(shaderProgram);

    if (
      verbosityLevel > 0 &&
      !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)
    ) {
      console.error(
        "Error linking program",
        gl.getProgramInfoLog(shaderProgram)
      );
      return;
    }
    return shaderProgram;
  }

  /**
   * Prepares the uniforms for the shader program
   * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
   * @param {boolean} verbose if true, success message is printed
   * @returns {void}
   */
  prepareUniform = (uniforms = null) => {
    const gl = GLContext.getInstance().gl;
    const verbosityLevel = 5;
    const program = this.program;

    gl.useProgram(program);

    var usedUniforms = [];
    var unusedUniforms = [];
    if (uniforms === null || uniforms === undefined) return;

    if (Array.isArray(uniforms)) {
      for (const uniform of uniforms) {
        const uniformLocation = gl.getUniformLocation(program, uniform.name);
        if (uniformLocation === null) {
          unusedUniforms.push([uniform.name, [uniform.type, uniform.value]]);
          continue;
        } else {
          usedUniforms.push([uniform.name, [uniform.type, uniform.value]]);
        }
        if (uniform.type === "bool") {
          gl.uniform1i(uniformLocation, uniform.value);
        } else if (uniform.type === "1f") {
          gl.uniform1f(uniformLocation, uniform.value);
        } else if (uniform.type === "1fv") {
          gl.uniform1fv(uniformLocation, uniform.value);
        } else if (uniform.type === "2fv") {
          gl.uniform2fv(uniformLocation, uniform.value);
        } else if (uniform.type === "3fv") {
          gl.uniform3fv(uniformLocation, uniform.value);
        } else if (uniform.type === "4fv") {
          gl.uniform4fv(uniformLocation, uniform.value);
        } else if (uniform.type === "1i") {
          gl.uniform1i(uniformLocation, uniform.value);
        } else if (uniform.type === "1iv") {
          gl.uniform1iv(uniformLocation, uniform.value);
        } else if (uniform.type === "2iv") {
          gl.uniform2iv(uniformLocation, uniform.value);
        } else if (uniform.type === "3iv") {
          gl.uniform3iv(uniformLocation, uniform.value);
        } else if (uniform.type === "4iv") {
          gl.uniform4iv(uniformLocation, uniform.value);
        } else {
          console.error("Unknown uniform type:", uniform.type);
        }
        // add to uniform list
        this.uniformList.push(uniform.name);
      }
    } else if (typeof uniforms !== "object") {
      for (var [uniformName, [type, value]] of Object.entries(uniforms)) {
        const uniformLocation = gl.getUniformLocation(program, uniformName);
        if (uniformLocation === null) {
          unusedUniforms.push([uniformName, [type, value]]);
          continue;
        } else {
          usedUniforms.push([uniformName, [type, value]]);
        }
        if (type === "bool") {
          gl.uniform1i(uniformLocation, value);
        } else if (type === "1f") {
          gl.uniform1f(uniformLocation, value);
        } else if (type === "1fv") {
          gl.uniform1fv(uniformLocation, value);
        } else if (type === "2fv") {
          gl.uniform2fv(uniformLocation, value);
        } else if (type === "3fv") {
          gl.uniform3fv(uniformLocation, value);
        } else if (type === "4fv") {
          gl.uniform4fv(uniformLocation, value);
        } else if (type === "1i") {
          gl.uniform1i(uniformLocation, value);
        } else if (type === "1iv") {
          gl.uniform1iv(uniformLocation, value);
        } else if (type === "2iv") {
          gl.uniform2iv(uniformLocation, value);
        } else if (type === "3iv") {
          gl.uniform3iv(uniformLocation, value);
        } else if (type === "4iv") {
          gl.uniform4iv(uniformLocation, value);
        } else {
          console.groupEnd();
          console.error("Unknown uniform type:", type);
        }
        // add to uniform list
        this.uniformList[uniformName] = [type, value];
        return;
      }
    }
  };

  /**
   * Prepares the attributes for the shader program
   * @param {Object} attributes An object containing the attributes as { attributeName: [location, [size, type, normalized, stride, offset], bufferData, separate] }
   *                              * **attributeName**: A string passed for semantic identification.
   *                              * **location**:     Layout signifier, corresponding to attribute location in shader
   *                              * **size**:         Number of array elements composing one attribute unit (e.g. 2 for a vec2 inside the shader).
   *                              * **type**:         The OpenGL datatype (e.g. 'FLOAT' for GL_FLOAT)
   *                              * **normalized**:   0/1 representing whether the buffer should be normalized before passing it into shader.
   *                              * **stride**:       Stride window: "Of the array, every x'th element belongs to this attribute."
   *                              * **offset**:       Offset from start of array: The first element for this attribute is located at x'th position in the array."
   *                              * **bufferData**:   The array that is passed into a buffer.
   *                              * **separate**:     true/false representing whether multiple attributes should stored in separate buffers.
   * @returns {WebGLVertexArrayObject} A WebGLVertexArrayObject
   */
  prepareAttributes = (attributes, verbose = false, for_TF = false) => {
    const gl = this.gl;
    const program = this.program;
    const VAO = gl.createVertexArray();
    VAO.name = this.name + "_VAO" + (for_TF ? "_TF" : "");
    gl.bindVertexArray(VAO);

    gl.useProgram(program);
    // name: [location_in_shader, [size, type, normalized, stride, offset], [...]]
    // 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], data_array]

    var foundAttributes = [];
    var notFoundAttributes = [];

    this.AttributesPoolBuffer = gl.createBuffer();
    this.AttributesPoolBuffer.name = "AttributesPool_Buffer";

    if (Array.isArray(attributes)) {
      for (const attribute of attributes) {
        const attributeLocation = gl.getAttribLocation(program, attribute.name);
        if (attributeLocation === -1) {
          console.groupEnd();
          console.error(
            `${this.name}: Error enabling Vertex Attribute ${attribute.name}`
          );
          notFoundAttributes.push(attribute);
        } else if (attributeLocation !== attribute.location) {
          console.groupEnd();
          console.error(
            `Attribute ${attribute.name} prepared for location ${attribute.location} but is located at ${attributeLocation}`
          );
        } else {
          foundAttributes.push(attribute);
        }

        if (attribute.separate == true) {
          const separateAttributeBuffer = gl.createBuffer();
          separateAttributeBuffer.name = attribute.name + "_Buffer";
          this.bufferList.push(separateAttributeBuffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, separateAttributeBuffer);
          if (verbose) {
            console.info("Prepared separate buffer for", attribute.name + ".");
          }
        } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.AttributesPoolBuffer);
          if (verbose) {
            console.info("Added", attribute.name, "to pool buffer.");
          }
        }
        gl.bufferData(gl.ARRAY_BUFFER, attribute.data, gl.DYNAMIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, attribute.data);
        gl.enableVertexAttribArray(attributeLocation);
        // // if failed, print error
        // if (gl.getError() !== gl.NO_ERROR) {

        // }
        gl.vertexAttribPointer(
          attributeLocation,
          attribute.size,
          gl[attribute.type],
          attribute.normalized,
          attribute.stride,
          attribute.offset
        );
        this.attributeList.push(attribute);
      }
      return VAO;
    }
    for (const [
      attributeName,
      [
        location,
        [size, type, normalized, stride, offset],
        bufferData,
        separate = false,
      ],
    ] of Object.entries(attributes)) {
      const attributeLocation = gl.getAttribLocation(program, attributeName);
      if (attributeLocation === -1) {
        console.groupEnd();
        console.error(
          this.name + ":",
          "Error enabling Vertex Attribute",
          attributeName
        );
        // console.error('Attribute', attributeName, 'not found in', this.name);
        notFoundAttributes.push([
          attributeName,
          [location, [size, type, normalized, stride, offset], bufferData],
        ]);
      } else if (attributeLocation !== location) {
        console.groupEnd();
        console.error(
          "Attribute",
          attributeName,
          "prepared for location",
          location,
          "but is located at",
          attributeLocation
        );
      } else {
        foundAttributes.push([
          attributeName,
          [location, [size, type, normalized, stride, offset], bufferData],
        ]);
      }
      if (separate == true) {
        const separateAttributeBuffer = gl.createBuffer();
        separateAttributeBuffer.name = attributeName + "_Buffer";
        this.bufferList.push(separateAttributeBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, separateAttributeBuffer);
        if (verbose) {
          console.info("Prepared separate buffer for", attributeName + ".");
        }
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.AttributesPoolBuffer);
        if (verbose) {
          console.info("Added", attributeName, "to pool buffer.");
        }
      }

      gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferData);
      gl.enableVertexAttribArray(attributeLocation);
      // // if failed, print error
      // if (gl.getError() !== gl.NO_ERROR) {

      // }
      gl.vertexAttribPointer(
        attributeLocation,
        size,
        gl[type],
        normalized,
        stride,
        offset
      );
      this.attributeList[attributeName] = [
        attributeLocation,
        [size, type, normalized, stride, offset],
        bufferData,
      ];
    }

    if (
      verbose &&
      (foundAttributes.length > 0 || notFoundAttributes.length > 0)
    ) {
      console.groupCollapsed(this.name, "- prepared attributes:");
      if (foundAttributes.length > 0) {
        console.log(
          "FOUND:",
          ...foundAttributes.reduce((acc, found) => {
            acc.push(
              "\n  •",
              found[0],
              "\n\tLocation:",
              found[1][0],
              "\n\tSize:",
              found[1][1][0],
              "\n\tType:",
              found[1][1][1],
              "\n\tNormalized:",
              found[1][1][2],
              "\n\tStride:",
              found[1][1][3],
              "\n\tOffset:",
              found[1][1][4],
              "\n\tData:",
              found[1][2].slice(0, 3) + ", ..."
            );
            return acc;
          })
        );
      }
      if (notFoundAttributes.length > 0) {
        console.warn(
          "\n NOT FOUND:",
          ...notFoundAttributes.reduce((acc, notFound) => {
            acc.push(
              "\n  •",
              notFound[0],
              "\n\tLocation:",
              notFound[1][0],
              "\n\tSize:",
              notFound[1][1][0],
              "\n\tType:",
              notFound[1][1][1],
              "\n\tNormalized:",
              notFound[1][1][2],
              "\n\tStride:",
              notFound[1][1][3],
              "\n\tOffset:",
              notFound[1][1][4],
              "\n\tData:",
              notFound[1][2].slice(0, 3) + ", ..."
            );
            return acc;
          })
        );
      }
      console.groupEnd();
    }

    return VAO;
  };

  /**
   * Creates a texture object and binds it to the shader program
   * @param {string} sampler name of the sampler in the shader program
   * @param {Float32Array} texData an array buffer
   * @param {string} texName name of the texture
   * @param {number} width width of the texture
   * @param {number} height height of the texture
   * @param {string} interpolation texture interpolation mode: 'LINEAR' (default) or 'NEAREST'
   * @param {string} clamping texture clamping mode: CLAMP_TO_EDGE (default), REPEAT or MIRRORED_REPEAT
   * @param {boolean} verbose if true, success message is printed
   * @returns {WebGLTexture} texture object
   */
  prepareImageTexture = (
    sampler = "uSampler",
    texData,
    texName = "",
    width = 512,
    height = 512,
    interpolation = "LINEAR",
    clamping = "CLAMP_TO_EDGE",
    texUnit = 0,
    dontRotate = false,
    verbose = false
  ) => {
    const gl = this.gl;
    const program = this.program;
    // const programVAO = this.vao;

    gl.useProgram(program);

    // flip image vertically
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const texture = gl.createTexture();

    if (texName == "") {
      const nthTexture = Object.keys(this.textureList).length + 1;
      texName = this.name + "_Texture_" + nthTexture;
    }
    texture.name = texName;

    this.textureList[texName] = [texture, texUnit];
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (width <= 0 || height <= 0) {
      width = gl.canvas.width;
      height = gl.canvas.height;
    }

    if (!dontRotate) {
      // rotate texture by 90 degrees if not specified otherwise
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }

    // args: target, mipmap level, internal format, width, height, border (always 0), format, type, data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      texData
    ); // mipmapping
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[interpolation]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[interpolation]);

    // set to non-repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[clamping]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[clamping]);

    // bind texture to sampler
    const samplerLocation = gl.getUniformLocation(program, sampler);
    gl.uniform1i(samplerLocation, texUnit);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    if (verbose) {
      console.info(
        "Prepared texture:",
        texture,
        "with size:",
        width,
        texHeight
      );
    }
    texture.name = texName;
    texture.width = width;
    texture.height = height;
    return texture;
  };

  /**
   * Creates a buffer object and binds it to the shader program
   * @param {Float32Array} bufferData an array buffer
   * @param {string?} bufferName if provided, the buffer is named
   * @param {boolean} verbose if true, success message is printed
   * @returns {WebGLBuffer} buffer object
   */
  prepareBuffer = (bufferData, bufferName = "", verbose = false) => {
    const gl = this.gl;
    const program = this.program;
    const programVAO = this.vao;

    gl.useProgram(program);
    gl.bindVertexArray(programVAO);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    buffer.name = bufferName;
    this.bufferList.push(buffer);

    if (verbose) {
      console.info(
        "Prepared buffer:",
        buffer.name,
        "with size:",
        bufferData.length
      );
    }

    return buffer;
  };

  /**
   * Creates a framebuffer object (FBO) with a texture attached to it.
   * @param {string} name     Name of the FBO
   * @param {Object} textureStack a list of textures to be attached to the FBO, defined as { location: texture, location: texture, ... }
   * @param {number} width     Width of texture
   * @param {number} height    Height of texture
   * @param {number} textureFormat represents the internal format of the texture (default: gl.RGBA16F)
   * @param {boolean} withRenderBuffer if true, a render buffer is created and attached to the FBO
   * @param {boolean} verbose    if true, success message is printed
   * @returns {WebGLFramebuffer?} if successful: a complete framebuffer object, else null
   */
  prepareFramebufferObject = (
    name,
    textureStack,
    width,
    height,
    withRenderBuffer = false,
    verbose = false
  ) => {
    const gl = this.gl;
    const program = this.program;
    gl.useProgram(program);
    gl.bindVertexArray(this.vao);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    if (name === null) {
      fbo.name = texture.name + "FBO";
      if (this.fbo.length > 0) {
        fbo.name += "_" + this.fbo.length;
      }
    } else {
      fbo.name = name;
    }

    // texture stack: { texture: texture, location: location, name: name }
    // for (const [attributeName, [location, [size, type, normalized, stride, offset], bufferData, separate = false]] of Object.entries(attributes)) {
    var attachments = [];
    var count = 0;
    for (const [location, texture] of Object.entries(textureStack)) {
      if (texture.constructor.name !== "WebGLTexture") {
        console.groupEnd();
        console.error(
          "prepareFramebufferObject():",
          texture.name,
          "is not of type WebGLTexture"
        );
        return;
      }
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER, // target
        gl[location], // texture attachment point = the output location in the fragment shader
        gl.TEXTURE_2D, // texture target
        texture, // texture we rendered into
        0 // mipmap level, always 0 in webgl
      );
      attachments.push(location);
      count++;
    }

    if (attachments.length > 1) {
      gl.drawBuffers(attachments.map((attachment) => gl[attachment]));
    } else {
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    }

    // Define draw buffers to specify rendering outputs
    // gl.drawBuffers([
    //     gl.COLOR_ATTACHMENT0,  // Write to textureA
    //     gl.COLOR_ATTACHMENT1   // Write to textureB
    // ]);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.groupEnd();
      console.error(program.name, ":", fbo.name, "is incomplete");
    } else if (verbose) {
      console.info(
        program.name,
        ":",
        fbo.name,
        "with texture",
        texture.name,
        "is complete"
      );
    }

    if (withRenderBuffer) {
      const renderBuffer = gl.createRenderbuffer();
      renderBuffer.name = texture.name + "RenderBuffer";
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        width,
        height
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        renderBuffer
      );
      // this.bufferList.push(renderBuffer);
    }

    // unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.groupEnd();
      console.error(program.name, ":", fbo.name, "is incomplete");
      return null;
    } else {
      this.fbo.push(fbo);
      return fbo;
    }
  };

  /**
   * Creates a transform feedback buffer object and binds it to the shader program.
   * @param {Object} attributes a list of attributes to be associated with the TF_VAO, defined as { attributeName: [location, [size, type, normalized, stride, offset], bufferData, separate] }
   * @param {WebGLBuffer} buffer a buffer object
   * @param {number} bufferSize size of the buffer
   * @param {string} usage usage pattern of the buffer, e.g. 'DYNAMIC_DRAW' (default), 'STATIC_DRAW', 'STREAM_DRAW'
   * @param {boolean} verbose if true, success message is printed
   * @returns {WebGLBuffer} buffer object
   */
  prepareTransformFeedback(
    attributes,
    buffer,
    bufferSize,
    usage = "DYNAMIC_DRAW",
    verbose = false
  ) {
    // set to use program and get attached program name
    const gl = this.gl;
    const program = this.program;

    this.tfVao = this.prepareAttributes(attributes, true, true);
    this.vaoList.push(this.tfVao);

    gl.useProgram(program);
    this.tfBuffer = buffer;
    this.tfBufferSize = bufferSize;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.tfBufferSize, gl[usage]);
    if (verbose) {
      console.info("Transform feedback buffer created with size:", bufferSize);
    }

    gl.bindVertexArray(this.tfVao);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);

    const attribute = Object.entries(attributes)[0][0];
    const attributeLocation = Object.entries(attributes)[0][1][0];
    const attributeSize = Object.entries(attributes)[0][1][1][0];
    const attributeType = Object.entries(attributes)[0][1][1][1];
    const attributeNormalized = Object.entries(attributes)[0][1][1][2];
    const attributeStride = Object.entries(attributes)[0][1][1][3];
    const attributeOffset = Object.entries(attributes)[0][1][1][4];

    this.gl.enableVertexAttribArray(attributeLocation); // means that the buffer is bound to location 0
    this.gl.vertexAttribPointer(
      attributeLocation,
      attributeSize,
      gl[attributeType],
      attributeNormalized,
      attributeStride,
      attributeOffset
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindVertexArray(null);
    this.gl.useProgram(null);

    return this.tfBuffer;
  }

  /**
   * Updates the value of a uniform variable in the shader program.
   * @param {string} uniformName name of the uniform variable
   * @param {string} type type of the uniform variable
   * @param {any} value value of the uniform variable
   * @returns {void}
   */
  updateUniform = (uniformName, type, value) => {
    const gl = this.gl;
    const program = this.program;
    gl.useProgram(program);

    const uniformLocation = gl.getUniformLocation(program, uniformName);
    if (uniformLocation === null) {
      console.warn(
        this.name,
        ":",
        "attempt to update uniform",
        uniformName,
        "failed - not found/used"
      );
      return;
    }

    if (type === "bool") {
      gl.uniform1i(uniformLocation, value);
    } else if (type === "1f") {
      gl.uniform1f(uniformLocation, value);
    } else if (type === "1fv") {
      gl.uniform1fv(uniformLocation, value);
    } else if (type === "2fv") {
      gl.uniform2fv(uniformLocation, value);
    } else if (type === "3fv") {
      gl.uniform3fv(uniformLocation, value);
    } else if (type === "4fv") {
      gl.uniform4fv(uniformLocation, value);
    } else if (type === "1i") {
      gl.uniform1i(uniformLocation, value);
    } else if (type === "1iv") {
      gl.uniform1iv(uniformLocation, value);
    } else if (type === "2iv") {
      gl.uniform2iv(uniformLocation, value);
    } else if (type === "3iv") {
      gl.uniform3iv(uniformLocation, value);
    } else if (type === "4iv") {
      gl.uniform4iv(uniformLocation, value);
    } else {
      console.groupEnd();
      console.error("Unknown uniform type:", type);
    }
  };

  /**
   * Fetches the data from a buffer object and returns it as a Float32Array.
   *
   * Handy when debugging Transform Feedback operations.
   * Only use this for debugging purposes, as it is a blocking operation and can slow down the rendering process.
   * @param {WebGLBuffer} buffer a buffer object
   * @param {number} bufferSize size of the buffer
   * @returns {Float32Array} buffer data
   */
  readBufferData(buffer, bufferSize) {
    const view = new Float32Array(bufferSize);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, view);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return view;
  }

  /* SHADER UTILS: */
  /**
   * A function to log the values of a WebGLTexture to the console
   * @param {WebGL2RenderingContext} gl The WebGL2 rendering context
   * @param {WebGLTexture} texture The WebGLTexture to read from
   * @param {number} width The width of the texture
   * @param {number} height The height of the texture
   * @param {boolean} logAllValues A flag to log all values to the console
   */
  readTextureData = (texture, width, height, logAllValues = false) => {
    const gl = this.gl;

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    const data = new Float32Array(width * height * 4);
    // args: target, x, y, width, height, format, type, data
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (logAllValues) {
      console.debug("Read texture data:", data);
    }
    console.debug(
      " Fill:\t\t",
      data[0],
      "\n",
      "Heading:\t",
      data[1],
      "\n",
      "Acc.:\t\t",
      data[2],
      "\n",
      "Age:\t\t",
      data[3]
    );
  };

  /**
   * Render with Frame Buffer Object
   * @param {LegacyShader} shader The Shader with a framebuffer object
   * @param {WebGLTexture} inputTexture The texture to render into the framebuffer
   * @param {number | WebGLFramebuffer} fbo The framebuffer object to render into (default is 0)
   * @param {number} attachAtTextureUnit If the shader uses multiple textures, this parameter can be used to set the texture unit (default is null)
   * @param {WebGLTexture} texture The texture to be associated with the above texture unit
   * @param {function} drawArrays An optional function passed as gl-render instruction (default is gl.drawArrays(gl.TRIANGLE_FAN, 0, 4))
   * @returns {void}
   * @example
   * shaderWithFBO.renderWithFrameBuffer(
   *      inputTexture, 0,
   *      1, secondaryTexture,
   *      () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
   * );
   *
   */
  renderIntoTexture = (
    inputTexture,
    fbo = 0,
    attachAtTextureUnit = null,
    texture = null,
    transparency = false,
    drawArrays = () => this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4)
  ) => {
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);

    if (fbo.constructor.name != "Number") {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[fbo]);
    }
    if (attachAtTextureUnit != null && texture != null) {
      gl.activeTexture(gl.TEXTURE0 + attachAtTextureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    gl.clear(gl.COLOR_BUFFER_BIT);

    drawArrays();

    gl.disable(gl.BLEND);

    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  saveTextureToImage = (texture, width, height) => {
    //
  };

  /**
   * Logs the shader program information, including VAOs, FBOs, textures, buffers, attributes, and uniforms.
   * This is useful for debugging and understanding the shader program structure.
   */
  logShaderInfo() {
    const gl = this.gl;
    const program = this.program;

    console.groupCollapsed("Shader Info:", this.name);

    // VAOs
    console.groupCollapsed("VAOs");
    console.log(
      ...this.vaoList.reduce((acc, vao) => {
        acc.push("\n •", vao.name);
        return acc;
      }, [])
    );
    console.groupEnd();

    // FBOs
    if (this.fbo.length != 0) {
      console.groupCollapsed("FBOs");
      const getFBOTextureName = (program, fbo) => {
        if (fbo === null) {
          return "none";
        } else {
          gl.useProgram(program);
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          const tex = gl.getFramebufferAttachmentParameter(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME
          );
          return tex.name;
        }
      };
      console.log(
        this.fbo.length == 0 ? "none" : " ",
        ...this.fbo.reduce((acc, fbo) => {
          acc.push(
            "\n •",
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) ===
              gl.FRAMEBUFFER_COMPLETE
              ? "[COMPLETE]"
              : "[INCOMPLETE]",
            fbo.name,
            "\n\t→ bound to",
            getFBOTextureName(program, fbo)
          );
          return acc;
        }, [])
      );
      console.groupEnd();
    }

    // Textures
    console.groupCollapsed("Textures");
    console.log(
      this.textureList.length == 0 ? "none" : " ",
      ...Object.entries(this.textureList).reduce((acc, [name, [tex, unit]]) => {
        acc.push(
          "\n •",
          name,
          "\n\t",
          "bound to unit",
          unit,
          "\n\t",
          "size:",
          tex.width,
          "x",
          tex.height,
          "\n\t",
          "type:",
          tex.constructor.name,
          "\n\t",
          "texture object:",
          tex.name + "\n"
        );
        return acc;
      }, [])
    );
    console.groupEnd();

    // Buffers
    if (this.bufferList.length != 0) {
      console.groupCollapsed("Buffers");
      console.log(
        ...this.bufferList.reduce((acc, buff) => {
          gl.bindBuffer(gl.ARRAY_BUFFER, buff);
          const buffSize = gl.getBufferParameter(
            gl.ARRAY_BUFFER,
            gl.BUFFER_SIZE
          );
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          acc.push("\n •", buff.name + ":", buffSize, "Byte");
          return acc;
        }, [])
      );
      console.groupEnd();

      // Attributes
      console.groupCollapsed("Attributes");
      this.attributeList = [];
      for (
        let i = 0;
        i < gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        i++
      ) {
        const attribInfo = gl.getActiveAttrib(program, i);
        const attribName = attribInfo.name;
        const attribLocation = gl.getAttribLocation(program, attribName);
        const attribSize = attribInfo.size;
        this.attributeList.push({
          name: attribName,
          location: attribLocation,
          size: attribSize,
        });
      }
      console.log(
        "(" +
          gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) +
          " active)",
        ...this.attributeList.reduce((acc, attrib) => {
          acc.push(
            "\n •",
            attrib.name,
            "\n\t",
            "location:",
            attrib.location,
            "\n\t",
            "size:",
            attrib.size,
            "\n\t",
            "buffer:",
            attrib.name + "_Buffer" + "\n"
          );
          return acc;
        }, [])
      );
      console.groupEnd();
    }

    // Uniforms
    console.groupCollapsed("Uniforms");
    console.log(
      "(" + gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) + " active)"
    );
    // print all active uniforms
    this.uniformList = [];
    for (
      let i = 0;
      i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      i++
    ) {
      const uniformInfo = gl.getActiveUniform(program, i);
      const uniformName = uniformInfo.name;
      let uniformLocation = gl.getUniformLocation(program, uniformInfo.name);

      if (uniformLocation === null) {
        console.log("in UBO:", uniformName);
        continue;
      }
      const uniformType = gl.getActiveUniform(program, i).type;
      const uniformSize = gl.getActiveUniform(program, i).size;
      this.uniformList.push({
        name: uniformName,
        location: uniformLocation,
        type: uniformType,
        size: uniformSize,
      });
      console.log(
        "\n •",
        uniformName,
        "\n\t",
        "location:",
        uniformLocation,
        "\n\t",
        "type:",
        uniformType,
        "\n\t",
        "size:",
        uniformSize,
        "\n\t",
        "value:",
        gl.getUniform(program, uniformLocation)
      );
    }
    console.groupEnd();

    console.groupEnd();
  }
}
