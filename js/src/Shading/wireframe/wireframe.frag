#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define ORANGE vec4(1.0, 0.7, 0.2, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 0.5)

in vec3 vPosition;
in vec3 vColor;
in vec3 vBarycentric;

uniform sampler2D uSampler;
uniform mat4 uModel;
uniform bool uSelected;
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

// scale mat4 by xyz
mat4 scaleBy(mat4 m, float x, float y, float z) {
    m[0][0] *= x;
    m[1][1] *= y;
    m[2][2] *= z;
    return m;
}

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 pickingID;

float edgeFactor(float minWidth, float maxWidth) {
    vec3 d = fwidth(vBarycentric);
    float minBary = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);
    float unclampedEdge = 0.5 * min(d.x, min(d.y, d.z));
    float edge = clamp(unclampedEdge, minWidth, maxWidth);
    return 1.0 - smoothstep(0.0, edge, minBary);
}

vec4 wireframe(vec4 color, float width) {
    float minWidth = width; // Minimum allowed width (in pixels)
    float maxWidth = 0.5; // Maximum allowed width (in pixels)
    float alpha = edgeFactor(minWidth, maxWidth);
    // apply alpha to color
    return vec4(color.rgb, alpha);
}

void main() {
    // if (any(lessThan(vBarycentric, vec3(0.035)))) {
    //     fragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }
    // else {
    //     fragColor = ORANGE;
    //     // discard;
    // }

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 col = BLACK;
    float lineWidth = 0.01;
    if (uSelected) {
        col = ORANGE;
        lineWidth = 0.095;
    }
    fragColor = wireframe(col, lineWidth);
    pickingID = uPickingColor;
}
