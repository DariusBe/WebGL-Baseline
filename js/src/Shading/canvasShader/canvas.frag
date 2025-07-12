#version 300 es
precision highp float;

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vColor;

uniform sampler2D uSampler;
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

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    // vec4 cursor = prepareCursor(15.0, vec4(0.4471, 0.4471, 0.4471, 0.5));

    vec4 test = sin(uTime) * vec4(0.5, 0.5, 0.5, 1.0);
    vec4 tex = texture(uSampler, vTexCoord);

    fragColor = vec4(tex.rgb, 1.0);
}
