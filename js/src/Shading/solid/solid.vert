#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aColor;

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
out vec3 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vColor;
out vec2 vScreenPos;

void main() {
    gl_PointSize = 1.0;
    vTexCoord = aTexCoord;
    vNormal = aNormal;
    vColor = aColor;
    vPosition = aPosition;

    vec4 clipSpace = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vec3 ndc = clipSpace.xyz / clipSpace.w; // normalized device coordinates
    // Convert NDC [-1,1] to screen coordinates
    vScreenPos = ((ndc.xy + 1.0) * 0.5) * uResolution;

    gl_Position = clipSpace;
}
