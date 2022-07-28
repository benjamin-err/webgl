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

var positionBuffer = null;
var colorBuffer = null;

var positionAttributeLocation = null;
var colorAttributeLocation = null;

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
    //create a GL context
    gl = createContext(500  /*width*/, 500 /*height*/);

    //compile and link shader program
    program = createProgram(gl, resources.vs, resources.fs);

    positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    colorAttributeLocation = gl.getAttribLocation(program, 'a_color');

    // triangle x,y components
    var triangle = new Float32Array([
        // front
        -0.5, 0.5,
        -0.5, 0.0,
         0.5, 0.5,
         0.5, 0.5,
        -0.5, 0.0,
         0.5, 0.0]);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangle, gl.STATIC_DRAW);

    // triangle rgba color components
    var triangleColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.9, 0.5, 0.5, 1.0,
        0.2, 0.5, 0.9, 1.0,
        0.3, 0.3, 0.5, 1.0]);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleColors, gl.STATIC_DRAW);
    
}

/**
 * render one frame
 */
function render() {

    // clear the canvas
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    //clear the buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // use our program (pair of shaders)
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0 , 0);
  
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

}

//load the shader resources using a utility function
loadResources({
    vs: 'shader/empty.vs.glsl',
    fs: 'shader/empty.fs.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
    init(resources);

    //render one frame
    render();
});
