#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define GRAY vec4(vec3(0.15), 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define ORANGE vec4(1.0, 0.5, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vColor;

uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;

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

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = 2.0 * uMouse.xy * uResolution; // [0, 1] range
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    vec4 solid = texture(uSampler0, vTexCoord); // solid pass
    vec4 wireframe = texture(uSampler1, vTexCoord); // wireframe pass
    vec4 gizmo = texture(uSampler2, vTexCoord); // gizmo pass

    // fragColor = solid;
    // // Show both with additive blend
    vec4 solidWireframe = mix(solid, wireframe, wireframe.a);
    fragColor = solidWireframe;
    // fragColor.a = 1.0; // Ensure full opacity
    // fragColor = mix(BLACK, fragColor, gizmo.a); // Add gizmo pass with some transparency
    // fragColor = length(solid.rgb) < 0.01 ? vec4(vec3(0.0), 1.0) : fragColor; // discard if solid pass is too dark
}
