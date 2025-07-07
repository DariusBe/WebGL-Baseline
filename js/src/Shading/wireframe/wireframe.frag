#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)

in vec3 vPosition;
// in vec3 vNormal;
// in vec3 vColor;

uniform sampler2D uSampler;
uniform mat4 uModel;

// uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

out vec4 fragColor;

void main() {
    fragColor = BLACK;
}
