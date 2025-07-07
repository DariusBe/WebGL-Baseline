#version 300 es
//#pragma vscode_glsllint_stage : frag
// precision highp sampler2D;
precision mediump float;

#define PI 3.14159265359

// texture data
in vec2 vTexCoord;
uniform sampler2D uSampler; // texture unit 0

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
uniform float uAttenuation;
uniform int uKernelSize;
uniform float uKernel[99];
uniform bool uIsHorizontal;
uniform vec2 uNutrients[500];
uniform int uNutrientCount;

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    // if(uShowCursor == 0.0f) {
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0f);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0f) {
            if (fragColor.r < 1.0f) {
                fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
            }
        }
    }
    return cursor;
}

vec4 applyKernel() {
    vec2 texelSize = 1.0f / uResolution;
    vec4 sum = vec4(0.0f);
    int range = uKernelSize / 2;
    for (int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0f, float(i) * texelSize);
        if (uIsHorizontal) {
            offset = offset.yx;
        }
        sum += texture(uSampler, vTexCoord + offset) * uKernel[i + range];
    }
    return sum;
}

vec4 applySimpleBoxFilter() {
    vec4 sum = vec4(0.0f);
    vec2 texelSize = 1.0f / uResolution;
    int range = uKernelSize / 2;
    for (int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0f, float(i) * texelSize);
        if (uIsHorizontal) {
            offset = offset.yx;
        }
        sum += texture(uSampler, vTexCoord + offset);
    }
    return sum / float(uKernelSize);
}

float random(float seed) {
    return fract(sin(seed) * 43758.5453123f);
}

float randomSign(float seed) {
    return random(seed) > 0.5f ? 1.0f : -1.0f;
}

void main() {
    if (uKernelSize >= 3) {
        fragColor = applyKernel();
    } else {
        fragColor = texture(uSampler, vTexCoord);
    }
    fragColor = vec4(fragColor.rgb, 1.0f);
}
