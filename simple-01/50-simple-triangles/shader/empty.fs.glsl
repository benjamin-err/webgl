/**
 * empty basic fragment shader
 */

//need to specify how "precise" float should be
precision mediump float;

uniform vec4 u_color;

//entry point again
void main() {
    gl_FragColor = u_color; /* vec4(1, 0, 0.5, 1); */
}
