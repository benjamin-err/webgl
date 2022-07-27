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

var positionAttributeLocation = null;
var uniformColorLocation = null;

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
    //create a GL context
    gl = createContext(400 /*width*/, 400 /*height*/);

    //compile and link shader program
    program = createProgram(gl, resources.vs, resources.fs);

    // find the attribute and uniforms
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    uniformColorLocation = gl.getUniformLocation(program, "u_color");

    // attributes get their data from buffers, so we create one
    positionBuffer = gl.createBuffer();
    // bind the resource (positionBuffer) to the bind point ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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

    // turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
    
    // define how to extract the data from the currently bound position Buffer
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    // drawing 50 triangles
    for(var i = 0; i < 50; i++){
      
      var x = Math.random();
      var y = Math.random();
      var p1 = [Math.floor(x*100) % 2 == 0 ? x : -x, Math.floor(y*100) % 2 == 0 ? y : -y];
      
      x = Math.random();
      y = Math.random();
      var p2 = [Math.floor(x*100) % 2 == 0 ? x : -x, Math.floor(y*100) % 2 == 0 ? y : -y];
      
      x = Math.random();
      y = Math.random();
      var p3 = [Math.floor(x*100) % 2 == 0 ? x : -x, Math.floor(y*100) % 2 == 0 ? y : -y];

      // pass triangle points
      setTriangle(p1,p2,p3);
    
      // pass the color to the fragment shader
      gl.uniform4f(uniformColorLocation, Math.random(),Math.random(),Math.random(),1);

      // draw
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }
}

function setTriangle(p1, p2, p3){
    // take x, y components of each point and put them into the bounded buffer
    [x1, y1] = p1;
    [x2, y2] = p2;
    [x3, y3] = p3;

    var trigPoints = new Float32Array([
      x1,y1,
      x2,y2,
      x3,y3
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, trigPoints, gl.STATIC_DRAW);
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
