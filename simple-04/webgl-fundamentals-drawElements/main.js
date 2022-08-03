/*
 This code doesn't conform the required code structure for CG, can be easily adapted.
 Shaders are loaded from index.html and vertex coordinates are defined in screen space.
 */

// WebGL - 2D Rectangles
// from https://webglfundamentals.org/webgl/webgl-2d-rectangles-indexed.html
/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;
/**
 * program with vertex and fragment shader
 * @type {WebGLProgram}
 */

var program = null;

var positionBuffer, colorBuffer, indexBuffer;

// pixel space coordinates (converted to clip space in the vertex shader)
const vertices = new Float32Array([
    50, 50,
    150, 50,
    50, 100,
    150, 100
]);
const indices = new Float32Array([
    0, 1, 2,   // first triangle
    2, 1, 3   // second triangle
]);

const color = new Float32Array([
    0, 1, 1,
    1, 1, 0, 
    0, 0, 1, 
    1, 0, 0
]);

function main(resources) {

    var canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    //compile and link shader program
    program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    // look up the uniforms
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    initBuffers();

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Draw the rectangle.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function initBuffers() {
    // Create a buffer to put three 2d clip space points in
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

main();
