#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define GRAY vec4(0.5, 0.5, 0.5, 1.0)
#define TRANSPARENT vec4(0.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define ORANGE vec4(1.0, 0.647, 0.0, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec4 vColor;

uniform sampler2D uSampler;
uniform mat4 uModel;
uniform vec4 uPickingColor;

// std140, uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

vec3 getCameraPosition() {
    return vec3(uView[3]);
}

// Simple linear interpolation function
float lerp(float a, float b, float t) {
    return a + t * (b - a);
}

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 pickingID;

void main() {
    // if (length(WHITE) < 0.1) // or some condition for background
    //     discard;

    // vec3 camPos = getCameraPosition();
    // float radius = 35.0;
    // float dist = distance(vec2(camPos.x, camPos.z), vec2(vPosition.x, vPosition.z));

    // if (dist > radius) {
    //     discard; // Discard fragments outside the radius
    // } else {
    //     fragColor.a = 1.0;
    // }
    fragColor = vColor;
    pickingID = uPickingColor;
}
