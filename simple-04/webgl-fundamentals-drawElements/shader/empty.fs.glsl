precision mediump float;

uniform vec4 u_color;
varying vec3 v_color;

void main() {
 //gl_FragColor = u_color;
 gl_FragColor = vec4(v_color, 1.0);
}