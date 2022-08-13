/**
 * Created by Samuel Gratzl on 08.02.2016.
 */

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;
/**
 * our shader program
 * @type {WebGLProgram}
 */
var shaderProgram = null;
var context;

var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;

//camera and projection settings
var animatedAngle = 0;
var fieldOfViewInRadians = convertDegreeToRadians(30);

//links to buffer stored on the GPU
var quadVertexBuffer, quadColorBuffer;
var cubeVertexBuffer, cubeColorBuffer, cubeIndexBuffer;

// nodes
var root;
var robotTransformationNode;
var headTransformationNode;

var quadVertices = new Float32Array([
  -1.0, -1.0,
  1.0, -1.0,
  -1.0, 1.0,
  -1.0, 1.0,
  1.0, -1.0,
  1.0, 1.0]);

var quadColors = new Float32Array([
  1, 0, 0, //1,
  0, 1, 0, //1,
  0, 0, 1, //1,
  0, 0, 1, //1,
  0, 1, 0, //1,
  0, 0, 0//, 1
]);

var s = 0.3; //size of cube
var cubeVertices = new Float32Array([
  -s, -s, -s, s, -s, -s, s, s, -s, -s, s, -s,
  -s, -s, s, s, -s, s, s, s, s, -s, s, s,
  -s, -s, -s, -s, s, -s, -s, s, s, -s, -s, s,
  s, -s, -s, s, s, -s, s, s, s, s, -s, s,
  -s, -s, -s, -s, -s, s, s, -s, s, s, -s, -s,
  -s, s, -s, -s, s, s, s, s, s, s, s, -s,
]);

var cubeColors = new Float32Array([
  0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
  1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
]);

var cubeIndices = new Float32Array([
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15,
  16, 17, 18, 16, 18, 19,
  20, 21, 22, 20, 22, 23
]);

//load the shader resources using a utility function
loadResources({
  vs: 'shader/simple.vs.glsl',
  fs: 'shader/simple.fs.glsl',
  vs2: 'shader/vs2.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
  render(0);
});

function createSceneGraphContext(gl, shader) {

  //create a default projection matrix
  projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewInRadians, aspectRatio, 0.01, 10);
  gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_projection'), false, projectionMatrix);

  return {
    gl: gl,
    sceneMatrix: mat4.create(),
    viewMatrix: calculateViewMatrix(),
    projectionMatrix: projectionMatrix,
    shader: shader
  };
}

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {

  //create a GL context
  gl = createContext(canvasWidth, canvasHeight);

  shaderProgram = createProgram(gl, resources.vs, resources.fs);

  initQuadBuffer();
  initCubeBuffer();

  root = new SceneGraphNode();

  // quad transformation
  var quadTransformationMatrix = glm.rotateX(90);
  quadTransformationMatrix = mat4.multiply(mat4.create(), quadTransformationMatrix, glm.translate(0.0, -1, 1));
  quadTransformationMatrix = mat4.multiply(mat4.create(), quadTransformationMatrix, glm.scale(0.5, 0.5, 1));
  var quadTransformationNode = new TransformationSceneGraphNode(quadTransformationMatrix);
  root.append(quadTransformationNode);

  // quad shader
  var quadShaderProgram = createProgram(gl, resources.vs2, resources.fs);
  var quadStaticColorShaderNode = new ShaderSceneGraphNode(quadShaderProgram);
  quadTransformationNode.append(quadStaticColorShaderNode);

  // quad renderer
  var quadRenderNode = new QuadRenderNode();
  quadStaticColorShaderNode.append(quadRenderNode);

  // robot
  createRobot(root);
}

function createRobot(root) {

  // robot transformation
  var robotTransformationMatrix = glm.rotateY(animatedAngle / 2);
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.5, 0.9, 0));
  robotTransformationNode = new TransformationSceneGraphNode(robotTransformationMatrix);
  root.append(robotTransformationNode);

  // head
  // head transformation
  var headTransformationMatrix = glm.rotateY(animatedAngle);
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0, 0.45, 0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.45, 0.45, 0.45));
  headTransformationNode = new TransformationSceneGraphNode(headTransformationMatrix);
  robotTransformationNode.append(headTransformationNode);

  // head cube
  var headCubeNode = new CubeRenderNode();
  headTransformationNode.append(headCubeNode);

  // body
  var bodyCubeNode = new CubeRenderNode();
  robotTransformationNode.append(bodyCubeNode);

  // left
  // left arm
  var leftArmTransformationMatrix = glm.rotateZ(10);
  leftArmTransformationMatrix = mat4.multiply(mat4.create(), leftArmTransformationMatrix, glm.translate(-.5, 0.1, 0));
  leftArmTransformationMatrix = mat4.multiply(mat4.create(), leftArmTransformationMatrix, glm.scale(0.7, 0.25, 0.25));
  var leftArmTransformationNode = new TransformationSceneGraphNode(leftArmTransformationMatrix);
  robotTransformationNode.append(leftArmTransformationNode);

  // left arm cube
  var leftArmNode = new CubeRenderNode();
  leftArmTransformationNode.append(leftArmNode);

  // left leg
  var leftLegTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-0.15, -0.6, 0));
  leftLegTransformationMatrix = mat4.multiply(mat4.create(), leftLegTransformationMatrix, glm.scale(0.3, 1, 0.4));
  var leftLegTransformationNode = new TransformationSceneGraphNode(leftLegTransformationMatrix);
  robotTransformationNode.append(leftLegTransformationNode);

  // left leg cube
  var leftLegNode = new CubeRenderNode();
  leftLegTransformationNode.append(leftLegNode);

  // left foot
  var leftFootTransformationMatrix = glm.translate(-0.15, -1, 0.09);
  leftFootTransformationMatrix = mat4.multiply(mat4.create(), leftFootTransformationMatrix, glm.scale(0.3, 0.3, 0.7));
  var leftFootTransformationNode = new TransformationSceneGraphNode(leftFootTransformationMatrix);
  robotTransformationNode.append(leftFootTransformationNode);

  // left foot cube
  var leftFootNode = new CubeRenderNode();
  leftFootTransformationNode.append(leftFootNode);

  // right
  // right arm
  var rightArmTransformationMatrix = glm.rotateZ(-10);
  rightArmTransformationMatrix = mat4.multiply(mat4.create(), rightArmTransformationMatrix, glm.translate(.5, 0.1, 0));
  rightArmTransformationMatrix = mat4.multiply(mat4.create(), rightArmTransformationMatrix, glm.scale(0.7, 0.25, 0.25));
  var rightArmTransformationNode = new TransformationSceneGraphNode(rightArmTransformationMatrix);
  robotTransformationNode.append(rightArmTransformationNode);

  // right arm cube
  var rightArmNode = new CubeRenderNode();
  rightArmTransformationNode.append(rightArmNode);

  // right leg
  var rightLegTransformationMatrix = glm.translate(0.15, -0.6, 0);
  rightLegTransformationMatrix = mat4.multiply(mat4.create(), rightLegTransformationMatrix, glm.scale(0.3, 1, 0.4));
  var rightLegtTransformationNode = new TransformationSceneGraphNode(rightLegTransformationMatrix);
  robotTransformationNode.append(rightLegtTransformationNode);

  // right leg cube
  var rightLegNode = new CubeRenderNode();
  rightLegtTransformationNode.append(rightLegNode);

  // right foot
  var rightFootTransformationMatrix = glm.translate(0.15, -1, 0.09);
  rightFootTransformationMatrix = mat4.multiply(mat4.create(), rightFootTransformationMatrix, glm.scale(0.3, 0.3, 0.7));
  var rightFootTransformationNode = new TransformationSceneGraphNode(rightFootTransformationMatrix);
  robotTransformationNode.append(rightFootTransformationNode);

  // right foot cube
  var rightFootNode = new CubeRenderNode();
  rightFootTransformationNode.append(rightFootNode);
}

function initQuadBuffer() {

  //create buffer for vertices
  quadVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
  //copy data to GPU
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

  //same for the color
  quadColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadColors, gl.STATIC_DRAW);
}

function initCubeBuffer() {

  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}

/**
 * render one frame
 */
function render(timeInMilliseconds) {

  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffers for color and depth
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);  // More on depth handling in the next lab

  //activate this shader program
  gl.useProgram(shaderProgram);

  context = createSceneGraphContext(gl, shaderProgram);

  var robotTransformationMatrix = glm.rotateY(-animatedAngle / 2);
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.5, 0.5, 0));
  robotTransformationNode.setMatrix(robotTransformationMatrix);

  var headTransformationMatrix = glm.rotateY(animatedAngle);
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0, 0.45, 0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.45, 0.45, 0.45));
  headTransformationNode.setMatrix(headTransformationMatrix);

  root.render(context);

  //renderRobot(context.sceneMatrix, context.viewMatrix);
  //request another render call as soon as possible
  requestAnimationFrame(render);

  animatedAngle = timeInMilliseconds / 10;
}

function renderRobot(sceneMatrix, viewMatrix) {

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);

  // TASK 10-2
  sceneMatrix = matrixMultiply(sceneMatrix, makeYRotationMatrix(convertDegreeToRadians(-animatedAngle / 2)));
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(0.5, 0.9, 0));
  // store current sceneMatrix in originSceneMatrix, so it can be restored
  var originSceneMatrix = sceneMatrix;

  // TASK 9 and 10

  // head
  sceneMatrix = matrixMultiply(sceneMatrix, makeYRotationMatrix(convertDegreeToRadians(-animatedAngle)));
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(0, 0.45, 0));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.45, 0.45, 0.45));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  // TASK 8-3
  renderCube();


  // TASK 10-1
  // body
  sceneMatrix = originSceneMatrix; // go back before the head transformations
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // left arm
  sceneMatrix = originSceneMatrix;

  sceneMatrix = matrixMultiply(sceneMatrix, makeZRotationMatrix(convertDegreeToRadians(10)));
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(-.5, 0.1, 0));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.7, 0.25, 0.25));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // left arm
  sceneMatrix = originSceneMatrix;
  sceneMatrix = matrixMultiply(sceneMatrix, makeZRotationMatrix(convertDegreeToRadians(-10)));
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(.5, 0.1, 0));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.7, 0.25, 0.25));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // left leg
  sceneMatrix = originSceneMatrix;
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(-0.15, -0.6, 0));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.3, 1, 0.4));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // right leg
  sceneMatrix = originSceneMatrix;
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(0.15, -0.6, 0));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.3, 1, 0.4));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // left foot
  sceneMatrix = originSceneMatrix;
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(-0.15, -1, 0.09));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.3, 0.3, 0.7));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

  // right foot
  sceneMatrix = originSceneMatrix;
  sceneMatrix = matrixMultiply(sceneMatrix, makeTranslationMatrix(0.15, -1, 0.09));
  sceneMatrix = matrixMultiply(sceneMatrix, makeScaleMatrix(0.3, 0.3, 0.7));
  setUpModelViewMatrix(viewMatrix, sceneMatrix);
  renderCube();

}

function renderCube() {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
}

function calculateViewMatrix() {
  //compute the camera's matrix
  var eye = [0, 3, 5];
  var center = [0, 0, 0];
  var up = [0, 1, 0];
  viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
  return viewMatrix;
}

function setUpModelViewMatrix(viewMatrix, sceneMatrix) {

  var modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, sceneMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_modelView'), false, modelViewMatrix);
}

class SceneGraphNode {

  constructor() {
    this.children = [];
  };

  append(child) {
    this.children.push(child);
    return child;
  };

  remove(child) {
    var index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    return index => 0;
  };

  render(context) {
    this.children.forEach(function (c) {
      return c.render(context);
    });
  };
}

class QuadRenderNode extends SceneGraphNode {
  constructor() {
    super();
  }

  render(context) {
    // multiply view and scene matrix and set the uniform
    setUpModelViewMatrix(context.viewMatrix, context.sceneMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);

    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    /* 
        var cl = gl.getAttribLocation(context.shader, 'a_color');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
        gl.vertexAttribPointer(cl, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cl);
     */
    //gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    super.render(context);
  }
}

class CubeRenderNode extends SceneGraphNode {
  constructor() {
    super();
  }

  render(context) {
    // multiply view and scene matrix and set the uniform
    setUpModelViewMatrix(context.viewMatrix, context.sceneMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);

    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    //gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    super.render(context);
  }
}

class TransformationSceneGraphNode extends SceneGraphNode {

  constructor(matrix) {
    super();
    this.matrix = matrix || mat4.create();
  }

  render(context) {
    var previous = context.sceneMatrix;

    if (previous === null) {
      context.sceneMatrix = mat4.clone(this.matrix);
    }
    else {
      context.sceneMatrix = mat4.multiply(mat4.create(), previous, this.matrix);
    }

    super.render(context);

    context.sceneMatrix = previous;
  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }
}

class ShaderSceneGraphNode extends SceneGraphNode {
  constructor(shader) {
    super();
    this.shader = shader;
  }

  render(context) {
    var backup = context.shader;

    // set 
    context.shader = this.shader;
    context.gl.useProgram(this.shader);

    // recursive call
    super.render(context);

    // set back after recursive step ends
    context.shader = backup;
    context.gl.useProgram(backup);
  }
}

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeTranslationMatrix(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeXRotationMatrix(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
};

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeYRotationMatrix(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
};

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeZRotationMatrix(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeScaleMatrix(sx, sy, sz) {
  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1
  ];
}

function makeIdentityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makeOrthographicProjectionMatrix(left, right, bottom, top, near, far) {
  return [
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -2 / (far - near), 0,
    -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
  ];
}

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
function makePerspectiveProjectionMatrix(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
};

// Helper function taken from webglfundamentals.org tutorials
// Note that OpenGL expects the transposed matrix (when compared to slide)
var matrixMultiply = function (b, a) {
  var a00 = a[0 * 4 + 0];
  var a01 = a[0 * 4 + 1];
  var a02 = a[0 * 4 + 2];
  var a03 = a[0 * 4 + 3];
  var a10 = a[1 * 4 + 0];
  var a11 = a[1 * 4 + 1];
  var a12 = a[1 * 4 + 2];
  var a13 = a[1 * 4 + 3];
  var a20 = a[2 * 4 + 0];
  var a21 = a[2 * 4 + 1];
  var a22 = a[2 * 4 + 2];
  var a23 = a[2 * 4 + 3];
  var a30 = a[3 * 4 + 0];
  var a31 = a[3 * 4 + 1];
  var a32 = a[3 * 4 + 2];
  var a33 = a[3 * 4 + 3];
  var b00 = b[0 * 4 + 0];
  var b01 = b[0 * 4 + 1];
  var b02 = b[0 * 4 + 2];
  var b03 = b[0 * 4 + 3];
  var b10 = b[1 * 4 + 0];
  var b11 = b[1 * 4 + 1];
  var b12 = b[1 * 4 + 2];
  var b13 = b[1 * 4 + 3];
  var b20 = b[2 * 4 + 0];
  var b21 = b[2 * 4 + 1];
  var b22 = b[2 * 4 + 2];
  var b23 = b[2 * 4 + 3];
  var b30 = b[3 * 4 + 0];
  var b31 = b[3 * 4 + 1];
  var b32 = b[3 * 4 + 2];
  var b33 = b[3 * 4 + 3];
  return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
  a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
  a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
  a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
  a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
  a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
  a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
  a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
  a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
  a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
  a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
  a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
  a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
  a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
  a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
  a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33];
};

/**
   * Computes the inverse of a matrix.
   * @param {Matrix4} m matrix to compute inverse of
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix of none provided
   * @memberOf module:webgl-3d-math
   */
function makeInverse(m, dst) {
  dst = dst || new Float32Array(16);
  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];
  var tmp_0 = m22 * m33;
  var tmp_1 = m32 * m23;
  var tmp_2 = m12 * m33;
  var tmp_3 = m32 * m13;
  var tmp_4 = m12 * m23;
  var tmp_5 = m22 * m13;
  var tmp_6 = m02 * m33;
  var tmp_7 = m32 * m03;
  var tmp_8 = m02 * m23;
  var tmp_9 = m22 * m03;
  var tmp_10 = m02 * m13;
  var tmp_11 = m12 * m03;
  var tmp_12 = m20 * m31;
  var tmp_13 = m30 * m21;
  var tmp_14 = m10 * m31;
  var tmp_15 = m30 * m11;
  var tmp_16 = m10 * m21;
  var tmp_17 = m20 * m11;
  var tmp_18 = m00 * m31;
  var tmp_19 = m30 * m01;
  var tmp_20 = m00 * m21;
  var tmp_21 = m20 * m01;
  var tmp_22 = m00 * m11;
  var tmp_23 = m10 * m01;

  var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
    (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
    (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
    (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
    (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
    (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
  dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
    (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
  dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
    (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
  dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
    (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
  dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
    (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
  dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
    (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
  dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
    (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
  dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
    (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
  dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
    (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
  dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
    (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
  dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
    (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
  dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
    (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

  return dst;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 * Note: Function taken from glMatrix JavaScript library (see libs folder)
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {Float32Array} out
 */
function lookAt(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz) {

  var out = makeIdentityMatrix;

  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
};

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
