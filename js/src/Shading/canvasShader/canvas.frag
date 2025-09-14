#version 300 es
precision highp float;

#define TRANSPARENT vec4(0.0, 0.0, 0.0, 0.0)
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
uniform sampler2D uSampler3;

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
    // Sample the textures
    vec4 solid = texture(uSampler0, vTexCoord); // Solid pass
    vec4 wireframe = texture(uSampler1, vTexCoord); // Wireframe pass
    vec4 grid = texture(uSampler2, vTexCoord); // Grid pass

    // Start with the grid as the base layer
    vec4 baseColor = grid;
    // Blend the solid pass on top of the grid
    baseColor = mix(baseColor, solid, 1.0 - wireframe.a);
    // Add the wireframe pass on top of the solid pass
    baseColor = mix(baseColor, wireframe, 1.0 - grid.a);

    // Output the final color
    fragColor = baseColor;
}
