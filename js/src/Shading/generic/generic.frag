#version 300 es
precision highp float;

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define ORANGE vec4(1.0, 0.5, 0.0, 1.0)
#define PURPLE vec4(0.5, 0.0, 0.5, 1.0)
#define PI 3.14159265359

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vColor;

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

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 pickingID;

vec4 prepareCursor(float radius, vec4 color) {
    vec2 mouse = 2.0 * uMouse.xy * uResolution; // [0, 1] range

    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (length(gl_FragCoord.xy - mouse) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

float hash(float p) {
    vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
    return fract(p2.x * p2.y * 95.4337);
}

vec4 threshold(vec4 col, vec4 lower, vec4 upper, float value) {
    if (max(col.r, max(col.g, col.b)) < value) {
        col = lower;
    } else {
        col = upper;
    }
    return col;
}

vec4 lambertianShading(vec4 lightPosition, vec4 lightColor, float lightIntensity) {
    vec4 lightDirection = normalize(lightPosition * uModel - vec4(vPosition, 1.0));
    float d = length(lightPosition.xyz - vPosition);
    float attenuation = 1.0 / max(d * d, 0.000001);

    float diffuse = max(dot(vec4(vNormal, 1.0), lightDirection), 0.05);
    vec3 baseColor = vColor.rgb * (diffuse * min(lightColor.rgb * attenuation * lightIntensity, 1.0));
    return vec4(baseColor, 1.0);
}

void main() {
    // vec4 lightPosition = vec4(5.0, 15.0, 25.0, 1.0) * uModel;
    // float lightIntensity = 150.0;
    // vec4 lightColor = vec4(1.0, 0.95342, 0.864706, 1.0) * lightIntensity;
    // vec3 lightDirection = normalize(lightPosition.xyz - vPosition);

    // float d = length(lightPosition.xyz - vPosition);
    // float attenuation = 1.0 / max(d * d, 0.00001);

    // float diffuse = max(dot(vNormal, lightDirection), 0.125);
    // vec3 baseColor = vColor.rgb * (diffuse * min(lightColor.rgb * attenuation, 1.0));
    // vec4 col = vec4(vNormal + (0.5 * hash(d)), 1.0);

    // vec3 sum = vec3(col.r + col.g + col.b) / 3.0;

    // col = vec4(sum, 1.0);

    // col = threshold(col, BLACK, WHITE, 0.5);

    // fragColor = col;
    vec4 light = vec4(0.0, 15.0, -25.0, 1.0);
    vec4 lightColor = vec4(1.0, 0.95342, 0.864706, 1.0);
    vec4 lambert = lambertianShading(light, lightColor, 1000.0);

    // Apply texture if available
    vec4 textureColor = texture(uSampler, vTexCoord);

    // if (textureColor.a < 0.1) {
    //     fragColor = lambert;
    // } else {

    fragColor = vec4(textureColor.rgb, 1.0);
    // fragColor.a = 1.0;
    pickingID = uPickingColor;

    // }
    // fragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
