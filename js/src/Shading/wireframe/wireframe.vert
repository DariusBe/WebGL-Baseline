#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aColor;
layout(location = 4) in vec3 aBarycentric;

uniform sampler2D uSampler;
uniform mat4 uModel;
uniform bool uSelected;

// std140, uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

out vec3 vPosition;
out vec3 vBarycentric;
out vec3 vColor;

void main() {
    vPosition = aPosition;
    vBarycentric = aBarycentric;
    vColor = aColor;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
