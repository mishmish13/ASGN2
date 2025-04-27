class Cube {
  constructor() {
    this.type='cube';
  //  this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
  //  this.size = 5.0;
  //  this.segments = 10;
  this.matrix= new Matrix4();

  }

  // render this shape
  render() {
    //var xy = this.position;
    var rgba = this.color;
    //var size = this.size;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // pass the matrix u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);



    // front of cube
    drawTriangle3D( [0.0,0.0,0.0,   1.0,1.0,0.0,    1.0,0.0,0.0]);
    drawTriangle3D( [0.0,0.0,0.0,   0.0,1.0,0.0,    1.0,1.0,0.0]);

    // pass the color of a point to u_FragColor uniform variable
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

    // top of cube
    drawTriangle3D( [0,1,0,   0,1,1,    1,1,1]);
    drawTriangle3D( [0,1,0,   1,1,1,    1,1,0]);

    // other sides of cube top, bottom, left, right, back
    // - fill in yourself -

    // right side of cube (x=1 plane)
    gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
    drawTriangle3D([1.0, 0.0, 0.0,    1.0, 1.0, 0.0,    1.0, 1.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 0.0,    1.0, 1.0, 1.0,    1.0, 0.0, 1.0]);


    // bottom of cube (y=0 plane)
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3D([
      0.0, 0.0, 0.0,    1.0, 0.0, 1.0,    1.0, 0.0, 0.0
    ]);
    drawTriangle3D([
      0.0, 0.0, 0.0,    0.0, 0.0, 1.0,    1.0, 0.0, 1.0
    ]);

    // left side of cube (x=0 plane)
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    drawTriangle3D([
      0.0, 0.0, 0.0,    0.0, 1.0, 0.0,    0.0, 1.0, 1.0
    ]);
    drawTriangle3D([
      0.0, 0.0, 0.0,    0.0, 1.0, 1.0,    0.0, 0.0, 1.0
    ]);

    // back of cube (z=1 plane)
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    drawTriangle3D([
      0.0, 0.0, 1.0,    0.0, 1.0, 1.0,    1.0, 1.0, 1.0
    ]);
    drawTriangle3D([
      0.0, 0.0, 1.0,    1.0, 1.0, 1.0,    1.0, 0.0, 1.0
    ]);

  

  }
}
