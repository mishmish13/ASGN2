// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    // gl_PointSize = 20.0;
    //gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let g_fillGap = false;
let lastMousePos = null;

let g_mouseDown = false,
    g_lastX = 0, g_lastY = 0,
    g_xAngle = 0, g_yAngle = 0;


let u_ModelMatrix;
let u_GlobalRotateMatrix;


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_Size
  // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  // if (!u_Size) {
  //   console.log('Failed to get the storage location of u_Size');
  //   return;
  // }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 3;

// globals related to UI elements
let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType=POINT;
let g_selectedSegments = 10;

let g_globalAngle = 0;
let g_armAngle = 0;
let g_leftArmAngle = 0;


let g_rightArmAngle= 0;
let g_armRightAngle = 0;

let g_armAnimation=false;
let g_upperArmAnimation = false;

let g_upperRightArmAnimation = false;
let g_lowerRightArmAnimation = false;

let g_leftThighAngle=0;
let g_leftCalfAngle=0;
let g_rightThighAngle=0;
let g_rightCalfAngle=0;

let g_leftThighAnimation=false;
let g_leftCalfAnimation = false;
let g_rightThighAnimation = false;
let g_rightCalfAnimation = false;

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {

  document.getElementById('animationUpperArmOFFButton').onclick = function() {g_upperArmAnimation = false;};
  document.getElementById('animationUpperArmONButton').onclick = function() {g_upperArmAnimation = true;};
  document.getElementById('animationArmOFFButton').onclick = function() {g_armAnimation = false;};
  document.getElementById('animationArmONButton').onclick = function() {g_armAnimation = true;};

  document.getElementById('animationUpperRightArmOFFButton').onclick = function() {g_upperRightArmAnimation = false;};
  document.getElementById('animationUpperRightArmONButton').onclick = function() {g_upperRightArmAnimation = true;};
  document.getElementById('animationRightArmOFFButton').onclick = function() {g_lowerRightArmAnimation = false;};
  document.getElementById('animationRightArmONButton').onclick = function() {g_lowerRightArmAnimation = true;};

  document.getElementById('animationLeftThighOFFButton').onclick = function() {g_leftThighAnimation = false;};
  document.getElementById('animationLeftThighONButton').onclick = function() {g_leftThighAnimation = true;};
  document.getElementById('animationLeftCalfArmOFFButton').onclick = function() {g_leftCalfAnimation = false;};
  document.getElementById('animationLeftCalfArmONButton').onclick = function() {g_leftCalfAnimation = true;};

  document.getElementById('animationRightThighArmOFFButton').onclick = function() {g_rightThighAnimation = false;};
  document.getElementById('animationRightThighArmONButton').onclick = function() {g_rightThighAnimation = true;};
  document.getElementById('animationRightCalfOFFButton').onclick = function() {g_rightCalfAnimation = false;};
  document.getElementById('animationRightCalfONButton').onclick = function() {g_rightCalfAnimation = true;};

  document.getElementById('armUpperSlide').addEventListener('mousemove', function () { g_leftArmAngle = this.value; renderAllShapes(); });
  document.getElementById('armSlide').addEventListener('mousemove', function () { g_armAngle = this.value; renderAllShapes(); });


  document.getElementById('armUpperRightSlide').addEventListener('mousemove', function () { g_rightArmAngle = this.value; renderAllShapes(); });
  document.getElementById('armRightSlide').addEventListener('mousemove', function () { g_armRightAngle = this.value; renderAllShapes(); });


  document.getElementById('leftThighSlide').addEventListener('mousemove', function () { g_leftThighAngle = this.value; renderAllShapes(); });
  document.getElementById('leftCalfSlide').addEventListener('mousemove', function () { g_leftCalfAngle = this.value; renderAllShapes(); });
  document.getElementById('rightThighSlide').addEventListener('mousemove', function () { g_rightThighAngle = this.value; renderAllShapes(); });
  document.getElementById('rightCalfSlide').addEventListener('mousemove', function () { g_rightCalfAngle = this.value; renderAllShapes(); });


  document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllShapes(); });

}

function main() {
  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablestoGLSL();

  // set up actions for the HTML UI elements
  addActionsForHtmlUI();


  canvas.onmousedown = function(ev) {
    g_mouseDown = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  };
  canvas.onmousemove = function(ev) {
    if (!g_mouseDown) return;
    let dx = ev.clientX - g_lastX;
    let dy = ev.clientY - g_lastY;
    g_yAngle += dx * 0.5;
    g_xAngle += dy * 0.5;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
    renderAllShapes();
  };
  canvas.onmouseup = function() {
    g_mouseDown = false;
  };




  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
  requestAnimationFrame(tick);

}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;
// called by browser repeatedly whenever it's time
function tick() {
  // save the current time
  g_seconds = performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);

  // update animation angles:
  updateAnimationAngles();

  // draw everything
  renderAllShapes();

  // tell the browser to update again when it has time
  requestAnimationFrame(tick);

}

function updateAnimationAngles() {
  if (g_armAnimation) {
    g_armAngle = (25*Math.sin(g_seconds));
  }
  if (g_upperArmAnimation) {
    g_leftArmAngle = (25*Math.sin(g_seconds));
  }

  if (g_lowerRightArmAnimation) {
    g_armRightAngle  = (25*Math.sin(g_seconds));
  }
  if (g_upperRightArmAnimation){
    g_rightArmAngle =  (25 * Math.sin(g_seconds));
  }
  if (g_leftThighAnimation) {
    g_leftThighAngle = (25*Math.sin(g_seconds));
  }
  if (g_rightThighAnimation) {
    g_rightThighAngle = (25*Math.sin(g_seconds));
  }
  if (g_leftCalfAnimation) {
    g_leftCalfAngle = (25*Math.sin(g_seconds));
  }
  if (g_rightCalfAnimation) {
    g_rightCalfAngle = (25*Math.sin(g_seconds));
  }


}


var g_shapesList = [];


function click(ev) {

  // extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  // if fill gap mode is turned on and there is a previous mouse position, draw a line between them
  if (g_fillGap) {
    if (lastMousePos !== null) {
      // create a new Line object between the last position and the current position
      let line = new Line(lastMousePos[0], lastMousePos[1], x, y, g_selectedColor, g_selectedSize);
      g_shapesList.push(line);
    }
    // update last mouse position
    lastMousePos = [x, y];
  }

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  }
  else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  }
  else {
    point = new Circle();
    point.segments = g_selectedSegments; // set number of segments per the slider
  }
  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  // draw every shape that is supposed to be in the canvas
  renderAllShapes();


}

// extract the event click and return it in webGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

// draw every shape that is supposed to be in the canvas
function renderAllShapes() {

  // pass the matrix to u_ModelMatrix attribute
  //var globalRotMat=new Matrix4().rotate(g_globalAngle,0,1,0);
  //gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  var M = new Matrix4();
  // single y-axis rotation from  slider
  M.setRotate(g_globalAngle, 0, 1, 0);
  M.rotate(g_yAngle, 0, 1, 0);
  M.rotate(g_xAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, M.elements);



  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);



  const bearColor = [0.35, 0.2, 0.1, 1.0];       // main brown
  const darkBrown  = [0.30, 0.15, 0.08, 1.0];     // a little darker

  // head
  var head = new Cube();
  head.color = darkBrown;
  head.matrix.translate(-.4,0.2,-0.1);
  head.matrix.scale(0.8,0.7,0.8);
  head.render();

  // eyes

  var eyeL = new Cube();
  eyeL.color = [0, 0, 0, 1];
  eyeL.matrix.translate(-.2,0.5,-0.11);
  eyeL.matrix.scale(0.1,0.1,0.1);
  eyeL.render();

  var eyeR = new Cube();
  eyeR.color = [0, 0, 0, 1];
  eyeR.matrix.translate(0.1,0.5,-0.11);
  eyeR.matrix.scale(0.1,0.1,0.1);
  eyeR.render();

  // mouth
  var mouth = new Cube();
  mouth.color = [0, 0, 0, 1];
  mouth.matrix.translate(-0.09,0.3,-0.11);
  mouth.matrix.scale(0.2,0.12,0.1);
  mouth.render();


  // body
  var body = new Cube();
  body.color = [0.35, 0.2, 0.1, 1];
  body.matrix.translate(-0.3,-0.6,-0.06);
  head.matrix.rotate(-8,1,0,0);
  body.matrix.scale(0.6,0.8,0.6);
  body.render();

  var leftLowerArm = new Cube();
  leftLowerArm.color = darkBrown;
  leftLowerArm.matrix.setTranslate(-0.2,-0.2,0.05);
  leftLowerArm.matrix.rotate(60, 0, 0, 1);
  leftLowerArm.matrix.rotate(-g_armAngle, 0, 0, 1);
  var armCoordsMat = new Matrix4(leftLowerArm.matrix);
  leftLowerArm.matrix.scale(0.22,0.3,0.3);
  leftLowerArm.matrix.translate(-0.5,0,0);
  leftLowerArm.render();

  // draw a left arm (WORK IN PROGRESS)
  var leftArm = new Cube();
  leftArm.color = darkBrown;
  leftArm.matrix = armCoordsMat;
  leftArm.matrix.translate(0,0.2,0.01);
  leftArm.matrix.rotate(-g_leftArmAngle,0,0,1);
  var handCoords = leftArm.matrix;
  leftArm.matrix.scale(0.23,0.3,0.3);
  leftArm.matrix.translate(-0.5,0,0);
  leftArm.render();

  var leftHand = new Cube();
  leftHand.color = [0.35, 0.2, 0.1, 1.0];
  leftHand.matrix = handCoords;
  leftHand.matrix.translate(-0.1,0.7,-0.01);
  leftHand.matrix.scale(1.2, 0.5,0.37);
  leftHand.render();


  var rightLowerArm = new Cube();
  rightLowerArm.color = darkBrown;
  rightLowerArm.matrix.setTranslate(0.2,-0.2,0.05);
  rightLowerArm.matrix.rotate(-60, 0, 0, 1);
  rightLowerArm.matrix.rotate(g_armRightAngle, 0, 0, 1);
  var rightArmCoordsMat = new Matrix4(rightLowerArm.matrix);
  rightLowerArm.matrix.scale(0.22,0.3,0.3);
  rightLowerArm.matrix.translate(-0.5,0,0);
  rightLowerArm.render();

  // draw a left arm (WORK IN PROGRESS)
  var rightArm = new Cube();
  rightArm.color = darkBrown;
  rightArm.matrix = rightArmCoordsMat;
  rightArm.matrix.translate(0,0.2,0.01);
  rightArm.matrix.rotate(g_rightArmAngle,0,0,1);
  var rightHandCoords = rightArm.matrix;
  rightArm.matrix.scale(0.23,0.3,0.3);
  rightArm.matrix.translate(-0.5,0,0);
  rightArm.render();

  var rightHand = new Cube();
  rightHand.color = [0.35, 0.2, 0.1, 1.0];
  rightHand.matrix = rightHandCoords;
  rightHand.matrix.translate(-0.1,0.7,-0.01);
  rightHand.matrix.scale(1.2, 0.5,0.37);
  rightHand.render();


  var leftUpperLeg = new Cube();
  leftUpperLeg.color = darkBrown;
  leftUpperLeg.matrix.setTranslate(-0.2,-0.7,-0.01);
  leftUpperLeg.matrix.rotate(-5, 1, 0, 0);
  leftUpperLeg.matrix.rotate(-g_leftThighAngle, 0, 0, 1);
  var calfCoordsMat= new Matrix4(leftUpperLeg.matrix);
  leftUpperLeg.matrix.scale(0.27,0.2,0.3);
  leftUpperLeg.matrix.translate(-0.5,0,0);
  leftUpperLeg.render();


  var leftLowerLeg = new Cube();
  leftLowerLeg.color = darkBrown;
  leftLowerLeg.matrix = calfCoordsMat;
  leftLowerLeg.matrix.translate(0,-0.1,-0.01);
  leftLowerLeg.matrix.rotate(-g_leftCalfAngle, 0, 0, 1);
  var leftCalfCoordsMat = new Matrix4(leftLowerLeg.matrix);

  leftLowerLeg.matrix.scale(0.27,0.2,0.3);
  leftLowerLeg.matrix.translate(-0.5,0,0);
  leftLowerLeg.render();


  var leftPaw = new Cube();
  leftPaw.color = [0.35, 0.2, 0.1, 1.0];
  leftPaw.matrix = leftCalfCoordsMat;
  leftPaw.matrix.translate(-0.15,-0.1,-0.02);
  leftPaw.matrix.scale(0.29,0.15,0.33);
  leftPaw.render();


  var rightUpperLeg = new Cube();
  rightUpperLeg.color = darkBrown;
  rightUpperLeg.matrix.setTranslate(0.2,-0.7,-0.01);
  rightUpperLeg.matrix.rotate(-5, 1, 0, 0);
  rightUpperLeg.matrix.rotate(g_rightThighAngle, 0, 0, 1);
  var rightThighCoordsMat = new Matrix4(rightUpperLeg.matrix);
  rightUpperLeg.matrix.scale(0.27,0.2,0.3);
  rightUpperLeg.matrix.translate(-0.5,0,0);
  rightUpperLeg.render();

  var rightLowerLeg = new Cube();
  rightLowerLeg.color = darkBrown;
  rightLowerLeg.matrix = rightThighCoordsMat;
  rightLowerLeg.matrix.translate(0,-0.1,-0.01);
  rightLowerLeg.matrix.rotate(g_rightCalfAngle, 0, 0, 1);
  var rightCalfCoordsMat = new Matrix4(rightLowerLeg.matrix);
  rightLowerLeg.matrix.scale(0.27,0.2,0.3);
  rightLowerLeg.matrix.translate(-0.5,0,0);
  rightLowerLeg.render();

  var rightPaw = new Cube();
  rightPaw.color = [0.35, 0.2, 0.1, 1.0];
  rightPaw.matrix = rightCalfCoordsMat;
  rightPaw.matrix.translate(-0.15,-0.1,-0.02);
  rightPaw.matrix.scale(0.29,0.15,0.33);
  rightPaw.render();


  // LEFT EAR
  var part = new Cube();
  part.color = [0.35, 0.2, 0.1, 1.0];
  part.matrix.setTranslate(-0.5, 0.65, -0.2);
  part.matrix.scale(0.3, 0.3, 0.1);
  part.render();

  // right ear

  var rEar = new Cube();
  rEar.color = [0.35, 0.2, 0.1, 1.0];
  rEar.matrix.setTranslate(0.2, 0.65, -0.2);
  rEar.matrix.scale(0.3, 0.3, 0.1);
  rEar.render();




  // check the time at the end of the function and show on web page
//  sendTexttoHTML( " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration))
}
