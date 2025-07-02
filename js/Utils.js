import { ModelOBJ } from "./ModelOBJ.js";

export class Utils {
  /**
   * Load an image.
   * @param {string} src The path to the image
   * @param {boolean?} verbose A flag to to print info
   * @returns {HTMLImageElement} The loaded image
   */
  static loadImage = (src, width = 500, height = 500) =>
    new Promise((resolve) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.src = src;
      // resize image to 128 x 128
      return img;
    });

  /**
   * Load an image concurrently.
   * @param {string} src The path to the image
   * @returns {HTMLImageElement} The loaded image
   */
  static async loadImageConcurrently(src) {
    var img = await this.loadImage(src);
    return img;
  }

  /**
   * Generate a texture with a test strip pattern.
   * @param {*} width The width of the texture.
   * @param {*} height The height of the texture.
   * @returns {Float32Array} A test strip texture with RGBA16F. Alpha is always 1.
   */
  static getEmptyStartTexture(width = 512, height = 512, verbose = false) {
    var textureData = new Float32Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      textureData[i * 4 + 0] = 0; // r
      textureData[i * 4 + 1] = 0; // g
      textureData[i * 4 + 2] = 0; // b
      textureData[i * 4 + 3] = 1; // a
    }
    if (verbose) {
      console.info("Generated empty start texture of size", width, "x", height);
    }
    // return Imagedata as RGBA16F
    return textureData;
  }

  /**
   * Generate a random texture.
   * @param {number} width The width of the texture
   * @param {number} height The height of the texture
   * @returns {Float32Array} A random texture with RGBA16F values ranging from 0 to 1. Alpha is always 1.
   */
  static getRandomStartTexture(width = 512, height = 512, verbose = false) {
    var textureData = new Float32Array(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      // Random value between 0 and 1 for each channel.
      textureData[i * 4 + 0] = Math.random(); // r       //occupation
      textureData[i * 4 + 1] = Math.random(); // g       //heading
      textureData[i * 4 + 2] = Math.random(); // b       //acceleration
      textureData[i * 4 + 3] = 0.0; // a (fully opaque) //age
    }

    if (verbose) {
      console.info(
        "Generated random start texture of size",
        width,
        "x",
        height
      );
    }
    return textureData;
  }

  /**
   * Generate a red texture.
   * @param {number} width The width of the texture
   * @param {number} height The height of the texture
   * @returns {Float32Array} A red texture with RGBA16F values ranging from 0 to 1. Alpha is always 1.
   * @example
   */
  static getPinkStartTexture(width = 512, height = 512, verbose = false) {
    var textureData = new Float32Array(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      textureData[i * 4 + 0] = 1.0; // r
      textureData[i * 4 + 1] = 0.0; // g
      textureData[i * 4 + 2] = 1.0; // b
      textureData[i * 4 + 3] = 1.0; // a
    }

    if (verbose) {
      console.info("Generated red start texture of size", width, "x", height);
    }
    return textureData;
  }

  /**
   * @param {string} path The path to a GLSL shader file
   * @returns {Promise<string>} The shader code as a string
   */
  static readShaderFile = async (path) => {
    const response = await fetch(path);
    const shaderCode = await response.text();
    return shaderCode;
  };

  /**
   * Positions for a quad covering the entire canvas.
   */
  static canvasPoints = new Float32Array([
    // QUAD bottom left
    -1.0, -1.0, 0.0,
    // QUAD bottom right
    1.0, -1.0, 0.0,
    // QUAD top right
    1.0, 1.0, 0.0,
    // QUAD top left
    -1.0, 1.0, 0.0,
  ]);

  /**
   * Quad texture coordinates for a full screen quad.
   */
  static quadTextCoords = new Float32Array([
    // QUAD bottom left
    0.0, 0.0,
    // QUAD bottom right
    1.0, 0.0,
    // QUAD top right
    1.0, 1.0,
    // QUAD top left
    0.0, 1.0,
  ]);

  /**
   * #### A Float32Array containing a the coordinates of a flat canvas plane and their texture coordinates in the following layout:
   * test
   * ---
   * [x][y][z]-[u][v] (5 BYTES per line (Stride), 3 BYTE Offset for aTexCoords)
   */
  static canvasAttribs = new Float32Array([
    // QUAD bottom left (xyz, uv)
    -1.0, -1.0, 0.0, 0.0, 0.0,
    // QUAD bottom right (xyz, uv)
    1.0, -1.0, 0.0, 1.0, 0.0,
    // QUAD top right (xyz, uv)
    1.0, 1.0, 0.0, 1.0, 1.0,
    // QUAD top left (xyz, uv)
    -1.0, 1.0, 0.0, 0.0, 1.0,
  ]);

  /**
   * #### A Float32Array containing a the coordinates of a flat canvas plane and their texture coordinates in the following layout:
   *
   * [x][y][z]-[u][v]-[nx][ny][nz] (8 BYTES per line (Stride), 3 BYTE Offset for aTexCoords, 3 BYTE Offset for aNormal)
   * This is used for rendering a quad with normals, e.g. for lighting calculations.
   */
  static canvasAttribsWithNormals = new Float32Array([
    // QUAD bottom left (xyz, uv, normal, rgb)
    -1.0, -1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0, 1.0, 0.0, 0.0,
    // QUAD bottom right (xyz, uv, normal, rgb)
    1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0,
    // QUAD top right (xyz, uv, normal, rgb)
    1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0,
    // QUAD top left (xyz, uv, normal, rgb)
    -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0,
  ]);

  /**
   * Generate random 2D-coordinates in the range [-1, 1].
   * @param {number} count The number of coordinates to generate
   * @returns {Float32Array} The generated 2D-coordinates as a Float32Array
   */
  static randomCoords = (count) => {
    const coors = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      coors[i * 2] = Math.random() * 2 - 1;
      coors[i * 2 + 1] = Math.random() * 2 - 1;
    }
    return coors;
  };

  static populateParticleBuffer = (
    count,
    max_x = width,
    max_y = height,
    min_x = 0,
    min_y = 0
  ) => {
    //XYZ, ID
    const particleBuffer = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      particleBuffer[i * 4] = Math.random() * (max_x - min_x) + min_x;
      particleBuffer[i * 4 + 1] = Math.random() * (max_y - min_y) + min_y;
      particleBuffer[i * 4 + 2] = Math.random() * Math.PI * 2;
      particleBuffer[i * 4 + 3] = i;
    }
    return particleBuffer;
  };

  static nutrientCoords = (count) => {
    switch (count) {
      case 2:
        return new Float32Array([0.35, 0.5, 0.65, 0.5]);
      case 3:
        return new Float32Array([0.66, 0.33, 0.5, 0.66, 0.33, 0.33]);
      case 6:
        return new Float32Array([
          0.25, 0.35, 0.5, 0.35, 0.75, 0.35, 0.25, 0.65, 0.5, 0.65, 0.75, 0.65,
        ]);
      case 7:
        return new Float32Array([
          0.32, 0.35, 0.5, 0.4, 0.75, 0.35, 0.4, 0.5, 0.25, 0.5, 0.75, 0.5,
          0.55, 0.65, 0.75, 0.55,
        ]);
      default:
        return new Float32Array([
          0.3715638951653736, 0.291180369331014, 0.6614210579096451,
          0.3003172097156794, 0.2080007489163321, 0.49486401665638247,
          0.22020364070662268, 0.3971622758318262, 0.19681279858066925,
          0.31330897622722065, 0.6030136788361201, 0.5391973495483013,
          0.52077766046438176, 0.30475286962436193, 0.7449068383017443,
          0.6233857133617585, 0.47990033287172074, 0.48083703128478883,
          0.33147205261634743, 0.431051531513159, 0.4809926636340479,
          0.296485507953117, 0.8504783276705522, 0.5039434959754798,
          0.2881654570077621, 0.53378135512882094, 0.5620647761777599,
          0.5499207667376604, 0.6420992736390268, 0.4348208016738996,
          0.6857405482471932, 0.270798324297984, 0.48060267086985936,
          0.55956845405425096, 0.3337561365121019, 0.7867930562155199,
          0.3658427854377905, 0.22825156948408387, 0.547903427230477,
          0.6220642691752063, 0.5131565661963695, 0.461698428364696,
          0.583998716989067, 0.6210929156000555, 0.39566166685916254,
          0.6363427221317297, 0.41248249796359887, 0.4665012421257128,
          0.7801886112763459, 0.2958757263192119, 0.5911643801005913,
          0.5016138933700167, 0.5008079014085803, 0.59655857760189832,
          0.2612423998052492, 0.5950426065122881, 0.525099007301276,
          0.33680984251087187, 0.2780683637310525, 0.6210740873542038,
        ]);
    }
  };

  /**
   * Generate a Gaussian kernel of a given size and sigma.
   * @param {number} size The size of the kernel, must be odd
   * @param {number} sigma The standard deviation of the Gaussian, higher values result in more blur
   * @param {boolean} verbose A flag to print the kernel to the console
   * @returns {Float32Array} The generated kernel
   */
  static gaussKernel1D(size, sigma = size / 6, verbose = false) {
    const kernel = new Float32Array(size);
    const center = (size - 1) / 2;
    let sum = 0.0;
    for (let i = 0; i < size; i++) {
      kernel[i] = Math.exp(-Math.pow(i - center, 2) / (2 * Math.pow(sigma, 2)));
      sum += kernel[i];
    }
    var total = 0.0;
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
      total += kernel[i];
    }
    if (verbose) {
      console.groupCollapsed("Generated Gaussian kernel");
      console.log("Size:", size + ", Sigma:", sigma + ", Total:", total);
      console.log(kernel);
      console.groupEnd();
    }
    if (sigma == 0) {
      // no blur
      kernel.fill(0);
      kernel[center] = 1;
    }
    return kernel;
  }

  /**
   * Generate a box kernel of a given size.
   * @param {number} size The size of the kernel, must be odd
   * @param {boolean} verbose A flag to print the kernel to the console
   * @returns {Float32Array} The generated kernel
   **/
  static boxKernel(size, verbose = false) {
    const kernel = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      kernel[i] = 1.0;
    }
    if (verbose) {
      console.info("Generated box kernel of size", size, ":", kernel);
    }
    return kernel;
  }

  /**
   * Prepares a Float32Array to be logged to the console in a readable format.
   *
   * @param {Float32Array} array The array to prepare
   * @param {number} rows The width of the array
   * @param {number?} cols The height of the array (can be omitted if the array is square)
   * @param {number?} precision The number of decimal places to show
   * @returns {string} The formatted string
   */
  static printMatrix = (matrix, cols, rows = cols, precision = 0) => {
    const maxLength = Math.max(
      ...matrix.map((num) => num.toFixed(precision).length)
    );
    var str = "";
    for (let i = 0; i < rows; i++) {
      str += "[ ";
      for (let j = 0; j < cols; j++) {
        str += matrix[i * cols + j].toFixed(precision).padStart(maxLength, " ");
        if (j < cols - 1) {
          str += ", ";
        }
      }
      str += i < rows - 1 ? " ]" + "\n " : " ]";
    }
    return str;
  };

  static degreestoRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };
  static radianstoDegrees = (radians) => {
    return (radians * 180) / Math.PI;
  };

  /**
   * Read a text file from the server and parse it into a Float32Array.
   * @param {string} path The path to the XYZ file
   * @returns {Promise<Float32Array>} The parsed XYZ data with the last element being the number of rows
   * @example
   * var topoMap = await Utils.readXYZMapToTexture('topo.xyz');
   * const size = topoMap[topoMap.length-1];
   * topoMap = topoMap.slice(0, topoMap.length-1);
   **/
  static readXYZMapToTexture = (path, rows = null) =>
    new Promise((resolve) => {
      // measure time until promise is resolved

      var map = fetch(path)
        .then((response) => response.text())
        .then((text) => {
          var max_x = Number.MIN_SAFE_INTEGER;
          var max_y = Number.MIN_SAFE_INTEGER;
          var max_z = Number.MIN_SAFE_INTEGER;

          var min_x = Number.MAX_SAFE_INTEGER;
          var min_y = Number.MAX_SAFE_INTEGER;
          var min_z = Number.MAX_SAFE_INTEGER;

          var lines = text.split("\n");
          var data = new Float32Array(1 + lines.length * 4);
          var empty_lines = 0;
          for (let i = 0; i < lines.length; i++) {
            // split by comma, space or semicolon
            var values = lines[i].split(",");
            if (values.length < 3) {
              values = lines[i].split(" ");
            }
            if (values.length < 3) {
              values = lines[i].split(";");
            }
            // skip if line is empty
            if (values.length == 3) {
              data[i * 4 + 0] = parseFloat(values[0]);
              data[i * 4 + 1] = parseFloat(values[1]);
              data[i * 4 + 2] = parseFloat(values[2]);

              // max
              if (parseFloat(values[0]) > max_x) {
                max_x = parseFloat(values[0]);
              }
              if (parseFloat(values[1]) > max_y) {
                max_y = parseFloat(values[1]);
              }
              if (parseFloat(values[2]) > max_z) {
                max_z = parseFloat(values[2]);
              }
              // min
              if (parseFloat(values[0]) < min_x) {
                min_x = parseFloat(values[0]);
              }
              if (parseFloat(values[1]) < min_y) {
                min_y = parseFloat(values[1]);
              }
              if (parseFloat(values[2]) < min_z) {
                min_z = parseFloat(values[2]);
              }
              data[i * 4 + 3] = 1.0;
            } else {
              empty_lines += 1;
            }
          }
          // remove trailing empty lines
          lines = lines.slice(0, lines.length - empty_lines);
          map = data.slice(0, 1 + lines.length * 4);
          // normalize all values: lowest mapped to 0, highest to 1
          for (let i = 0; i < lines.length; i++) {
            map[i * 4 + 0] = (map[i * 4 + 0] - min_x) / (max_x - min_x);
            map[i * 4 + 1] = (map[i * 4 + 1] - min_y) / (max_y - min_y);
            map[i * 4 + 2] = (map[i * 4 + 2] - min_z) / (max_z - min_z);
          }

          if (rows != null) {
            // set last to sqrt of rows
            map[lines.length * 4] = rows;
          } else {
            // set last to sqrt of lines
            map[lines.length * 4] = Math.sqrt(lines.length);
          }
          resolve(map);
        });
      return map;
    });

  /**
   * Normalizes a point cloud to the range [0, 1].
   * @param {Float32Array} pointCloud The array storing a point cloud
   * @returns {Float32Array} The normalized point cloud array
   */
  static normalizePointCloud = (pointCloud) => {
    // min should be 0, max should be 1
    var max_x = Number.MIN_SAFE_INTEGER;
    var max_y = Number.MIN_SAFE_INTEGER;
    var max_z = Number.MIN_SAFE_INTEGER;
    var min_x = Number.MAX_SAFE_INTEGER;
    var min_y = Number.MAX_SAFE_INTEGER;
    var min_z = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < pointCloud.length; i += 4) {
      // max
      if (pointCloud[i] > max_x) {
        max_x = pointCloud[i];
      }
      if (pointCloud[i + 1] > max_y) {
        max_y = pointCloud[i + 1];
      }
      if (pointCloud[i + 2] > max_z) {
        max_z = pointCloud[i + 2];
      }
      // min
      if (pointCloud[i] < min_x) {
        min_x = pointCloud[i];
      }
      if (pointCloud[i + 1] < min_y) {
        min_y = pointCloud[i + 1];
      }
      if (pointCloud[i + 2] < min_z) {
        min_z = pointCloud[i + 2];
      }
    }
    // normalize all values
    for (let i = 0; i < pointCloud.length; i += 4) {
      pointCloud[i] = (pointCloud[i] - min_x) / (max_x - min_x);
      pointCloud[i + 1] = (pointCloud[i + 1] - min_y) / (max_y - min_y);
      pointCloud[i + 2] = (pointCloud[i + 2] - min_z) / (max_z - min_z);
    }
    return pointCloud;
  };

  /**
   * Creates a download prompt for the PNG image of a Float32Array.
   * @param {Float32Array} data The data to save
   * @param {string} filename The name of the file to save
   * @param {number} width The width of the image
   * @param {number} height The height of the image
   */
  static saveArrayToImageFile = (data, filename, width, height) => {
    // save XYZ data array as png with (RGB)
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var imgData = ctx.createImageData(width, height);
    for (let i = 0; i < data.length; i += 4) {
      imgData.data[i] = data[i] * 255;
      imgData.data[i + 1] = data[i + 1] * 255;
      imgData.data[i + 2] = data[i + 2] * 255;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    var a = document.createElement("a");
    a.href = canvas.toDataURL();
    a.download = filename;
    a.click();
  };

  static getBufferContents = (
    gl,
    buffer,
    COUNT,
    cols = null,
    max = COUNT / 4
  ) => {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    const checkStatus = () => {
      const status = gl.clientWaitSync(sync, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
      if (status == gl.TIMEOUT_EXPIRED) {
        console.log("GPU busy.");
        setTimeout(checkStatus);
      } else if (status === gl.WAIT_FAILED) {
        console.erfor("Context lost.");
      } else {
        const view = new Float32Array(COUNT * 4);
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, view);
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
        if (cols) {
          console.log(Utils.printMatrix(view, cols, COUNT, 4));
        } else {
          console.log(...view);
        }
      }
    };
    setTimeout(checkStatus);
  };
}
