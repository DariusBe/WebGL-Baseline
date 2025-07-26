#version 300 es

#define BLACK vec4(0.0, 0.0, 0.0, 1.0)
#define WHITE vec4(1.0, 1.0, 1.0, 1.0)
#define RED vec4(1.0, 0.0, 0.0, 1.0)
#define GREEN vec4(0.0, 1.0, 0.0, 1.0)
#define BLUE vec4(0.0, 0.0, 1.0, 1.0)
#define PI 3.14159265359

layout(location = 0) in vec3 aPosition;
// std140
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

uniform int uInstanceCount;

out vec3 vPosition;
out vec4 vColor;

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

void prepareCursor(float radius, vec2 A, vec2 B, vec2 P1, vec2 P2) {
    // normalize moues position
    vec2 mousePos = uMouse.xy / uResolution.xy * 2.0 - 1.0;
    float mouseClick = uMouse.z;

    // vec2 cursorPos = vec2(0.0);

    if (mouseClick == 1.0) {
        int destination = 0;
        vec2 distA = mousePos.xy - A;
        vec2 distB = mousePos.xy - B;
        vec2 distP1 = mousePos.xy - P1;
        vec2 distP2 = mousePos.xy - P2;
        if (length(distA) < length(distB) && length(distA) < length(distP1)) {
            destination = 0;
        } else if (length(distP1) < length(distP2)) {
            destination = 1;
        } else if (length(distP2) < length(distB)) {
            destination = 2;
        } else {
            destination = 3;
        }

        if (gl_InstanceID == destination) {
            gl_Position = vec4(mousePos, 0.0, 1.0);
        }
    }
}

void distributePoints(int instanceCount) {
    // arrange points in a circle
    float angleStep = 2.0 * 3.141592653589793238 / float(instanceCount);
    float radius = 0.5; // Radius of the circle
    for (int i = 0; i < instanceCount; ++i) {
        float angle = float(gl_InstanceID) * angleStep;
        float x = radius * cos(angle);
        float y = radius * sin(angle);
        vPosition = vec3(x, y, 0.0); // Set the position

        gl_Position = vec4(vPosition, 1.0);
        switch (gl_InstanceID) {
            case 0:
            vPosition = vec3(0.0, 0.0, 0.0); // Center point
            break;
            default:
            vPosition = vec3(x, y, 0.0); // Set the position
        }

        gl_PointSize = 3.0; // Set point size for rendering
        gl_Position = vec4(vPosition, 1.0);
    }
}

void bezierCurveSimple(vec3 A, vec3 B, vec3 ctrl, int instances) {
    vPosition = vec3(0.0); // Set the position
    vColor = BLACK;
    float fraxel = 1.0 / length(uResolution);
    float id = float(gl_InstanceID);
    float count = float(instances);
    switch (gl_InstanceID) {
        case 0:
        vPosition = A;
        gl_PointSize = 25.0;
        vColor = RED;
        break;
        case 1:
        vPosition = ctrl;
        gl_PointSize = 25.0;
        vColor = GREEN;
        break;
        case 2:
        vPosition = B;
        gl_PointSize = 25.0;
        vColor = BLUE;
        break;

        default:
        // vec3 l = B + (ctrl * B);
        float t = id / (count - 3.0);
        vec3 mid_A_Ctrl_1 = mix(A, ctrl, t);
        vec3 mid_B_Ctrl_1 = mix(B, ctrl, 1.0 - t);
        vec3 mid_mid = mix(mid_A_Ctrl_1, mid_B_Ctrl_1, abs(sin(uTime * 0.025)));
        if (int(id) % 2 == 0) {
            vPosition = mix(mid_A_Ctrl_1, mid_B_Ctrl_1, abs(sin(uTime * 0.025)));
        } else {
            vPosition = mix(mid_A_Ctrl_1, mid_B_Ctrl_1, t);
        }
    }
    gl_Position = vec4(vPosition, 1.0);
}

void bezierCurveCubic(vec3 A, vec3 B, vec3 P1, vec3 P2, int instances) {
    vPosition = vec3(0.0); // Set the position
    vColor = BLACK;
    float fraxel = 1.0 / length(uResolution);
    float id = float(gl_InstanceID);
    float count = float(instances);
    switch (gl_InstanceID) {
        case 0:
        vPosition = A;
        gl_PointSize = 25.0;
        vColor = RED;
        break;
        case 1:
        vPosition = P1;
        gl_PointSize = 25.0;
        vColor = GREEN;
        break;
        case 2:
        vPosition = P2;
        gl_PointSize = 25.0;
        vColor = GREEN;
        break;
        case 3:
        vPosition = B;
        gl_PointSize = 25.0;
        vColor = BLUE;
        break;

        default:
        // vec3 l = B + (P1 * B);
        float t = id / (count - 4.0);
        vec3 A_P1 = mix(A, P1, t);
        vec3 B_P1 = mix(P1, B, t);
        vec3 A_B_P1 = mix(A_P1, B_P1, t);

        vec3 A_P2 = mix(A, P2, t);
        vec3 B_P2 = mix(P2, B, t);
        vec3 A_B_P2 = mix(A_P2, B_P2, t);

        if (int(id) % 1 == 0) {
            vPosition = mix(A_B_P1, A_B_P2, t);
        }
    }
    gl_Position = vec4(vPosition, 1.0);
}

void main() {
    vPosition = aPosition;
    gl_PointSize = 5.0;

    gl_Position = vec4(vPosition, 1.0);
    // distributePoints(uInstanceCount);
    vec3 A = vec3(-0.8, 0.0, 0.0);
    vec3 B = vec3(0.8, 0.0, 0.0);
    vec3 P1 = vec3(-0.25, sin(0.01 * uTime), 0.0);
    vec3 P2 = vec3(0.25, -0.65 + cos(0.01 * uTime), 0.0);

    bezierCurveCubic(A, B, P1, P2, uInstanceCount);
}
