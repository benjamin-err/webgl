/**
 * empty basic fragment shader
 */

//need to specify how "precise" float should be
precision mediump float;

varying vec4 v_color;

//entry point again
void main() {
    gl_FragColor = v_color; /*vec4(1, 0, 0.5, 1)*/; 
}
