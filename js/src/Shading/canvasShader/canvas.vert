#version 300 es

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in vec3 aColor;

// std140
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

uniform sampler2D uSampler;
uniform mat4 uModel;

out vec3 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vColor;

mat4 rotatationMatrix(float angle, int axis) {
    mat4 rot45 = mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(angle), -sin(angle), 0.0,
            0.0, sin(angle), cos(angle), 0.0,
            0.0, 0.0, 0.0, 1.0
        );

    switch (axis) {
        case 0:
        break;
        case 1:
        rot45 = mat4(
                cos(angle), 0.0, sin(angle), 0.0,
                0.0, 1.0, 0.0, 0.0,
                -sin(angle), 0.0, cos(angle), 0.0,
                0.0, 0.0, 0.0, 1.0
            );
        break;
        case 2:
        rot45 = mat4(
                cos(angle), -sin(angle), 0.0, 0.0,
                sin(angle), cos(angle), 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );
        break;
        default:
        rot45 = mat4(
                1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );
        break;
    }
    return rot45;
}

void main() {
    vPosition = aPosition;
    vTexCoord = aTexCoord;
    vNormal = aNormal;
    vColor = aColor;

    gl_Position = vec4(aPosition, 1.0);
}
