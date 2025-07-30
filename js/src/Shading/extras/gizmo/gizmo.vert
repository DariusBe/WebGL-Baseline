#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define ORANGE vec4(1.0, 0.647, 0.0, 1.0)

layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;

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
out vec3 vPosition;

vec3 buildGrid() {
    return vec3(0.0, 0.0, 0.0);
}

void main() {
    vPosition = aPosition;

    gl_Position = uProjection * uView * uModel * vec4(vPosition, 1.0);
}
