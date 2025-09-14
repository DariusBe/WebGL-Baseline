#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define BLUE vec4(0.0, 0.0, 1.0, 1.0)
#define ORANGE vec4(1.0, 0.5, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vColor;
in vec2 vScreenPos;

uniform sampler2D uSampler;
uniform mat4 uModel;
uniform vec4 uPickingColor;
uniform bool uSelected;

// uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 pickingID;

vec4 prepareCursor(float radius, vec4 color) {
    vec2 mouse = 2.0 * uMouse.xy * uResolution; // [0, 1] range

    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (length(gl_FragCoord.xy - mouse) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

float hash(float p) {
    vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
    return fract(p2.x * p2.y * 95.4337);
}

void main() {
    vec2 uv = vTexCoord;

    bool flipY = true;
    if (flipY) {
        uv *= vec2(1.0, -1.0); // flip Y
        uv += vec2(0.0, 1.0); // move back into [0, 1] range
    }

    vec4 textureColor = texture(uSampler, uv);

    fragColor = vec4(vColor, 1.0) * textureColor;

    pickingID = uPickingColor;
}
