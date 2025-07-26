#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define ORANGE vec4(1.0, 0.647, 0.0, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec4 vColor;

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
    fragColor = vec4(0.0, 1.0, 0.0, 1.0); // Default color
}
