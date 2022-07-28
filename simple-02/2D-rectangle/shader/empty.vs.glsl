/**
 * empty basic vertex shader
 */
 attribute vec2  a_position;
 attribute vec4 a_color;
 varying vec4 v_color;

//like a C program main is the main function
void main() {
   gl_Position = vec4(a_position, 0, 1);
   v_color = a_color;
}
