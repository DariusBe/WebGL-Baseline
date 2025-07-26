#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define ORANGE vec4(1.0, 0.647, 0.0, 1.0)

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec4 aColor;

uniform mat4 uModel;

// std140
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
out vec3 vPosition;
out vec4 vColor;

void main() {
    gl_PointSize = 25.0;
    vColor = aColor;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
