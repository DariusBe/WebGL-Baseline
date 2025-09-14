#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define ORANGE vec4(1.0, 0.647, 0.0, 1.0)

layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;

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

vec3 buildGrid() {
    return vec3(0.0, 0.0, 0.0);
}

mat4 faceCamera(mat4 model, mat4 view) {
    // extract model size
    vec3 scale;
    scale.x = length(model[0].xyz);
    scale.y = length(model[1].xyz);
    scale.z = length(model[2].xyz);
    mat4 invView = inverse(view);
    model[0] = invView[0];
    model[1] = invView[1];
    model[2] = invView[2];
    model[3] = model[3];
    model[0] *= scale.x;
    model[1] *= scale.y;
    model[2] *= scale.z;

    return model;
}

void main() {
    vPosition = aPosition;
    mat4 model = faceCamera(uModel, uView);
    gl_Position = uProjection * uView * model * vec4(aPosition, 1.0);
}
