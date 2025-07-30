#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec4 vColor;

uniform mat4 uModel;

// std140, uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
    bool uSelected;
};

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    float centerDist = length(gl_PointCoord - 0.5);
    float radius = 0.5;

    fragColor = vec4(vColor * step(centerDist, radius));
}
