const VERTEX = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
  precision mediump float;
  uniform vec2 uSize;
  uniform float uTime;
  uniform vec3 uColor;

  vec2 hash(vec2 p) {
    p = fract(p * vec2(0.1031, 0.11369));
    p += dot(p, p.yx + 19.19);
    return fract(vec2(p.x * p.y, (p.x + p.y) * p.x));
  }

  // Near a cell boundary, two moving light foci have almost the same distance.
  float causticEdge(vec2 p, float time) {
    vec2 cell = floor(p);
    vec2 local = fract(p);
    float nearest = 8.0;
    float next = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 offset = vec2(float(x), float(y));
        vec2 seed = hash(cell + offset);
        vec2 focus = 0.5 + 0.34 * sin(seed * 6.28318 + time * vec2(0.6, 0.48));
        vec2 delta = offset + focus - local;
        float distanceSq = dot(delta, delta);
        next = min(next, max(nearest, distanceSq));
        nearest = min(nearest, distanceSq);
      }
    }
    return sqrt(next) - sqrt(nearest);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uSize;
    float depth = 1.0 - uv.y;
    vec2 p = uv - vec2(0.48, 0.52);
    p.x *= uSize.x / uSize.y;
    p = mat2(0.94, -0.34, 0.34, 0.94) * p;
    p *= 5.6 + depth * 1.6;
    p += 0.26 * vec2(sin(p.y * 2.1 + uTime * 0.58), cos(p.x * 1.9 - uTime * 0.45));
    p += 0.13 * vec2(sin(p.y * 3.6 + p.x * 0.8 + uTime * 0.37), cos(p.x * 3.2 - p.y * 0.6 - uTime * 0.41));
    p += vec2(uTime * 0.12, -uTime * 0.07);

    float edge = causticEdge(p, uTime);
    float veins = exp(-edge * 22.0);
    float bloom = exp(-edge * 5.0);
    float surface = smoothstep(0.14, 0.42, depth) * (1.0 - smoothstep(0.72, 1.0, depth));
    float pool = exp(-2.3 * dot(uv - vec2(0.26, 0.6), uv - vec2(0.26, 0.6)));
    float swell = 0.75 + 0.25 * sin(p.x * 1.5 + p.y * 0.9 + sin(p.y * 1.8) - uTime * 0.42);
    float light = surface * pool * swell * (0.17 * veins + 0.15 * bloom);

    float ray = (uv.x - 0.18) / (0.7 + depth) - depth * 0.3;
    float shafts = pow(0.5 + 0.5 * sin(ray * 15.0 + uTime * 0.29), 3.0);
    light += 0.09 * shafts * pool * (1.0 - depth);
    gl_FragColor = vec4(uColor, light);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createCurrentLight(canvas: HTMLCanvasElement, color: readonly [number, number, number] = [0.67, 0.95, 1]) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: false });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  const triangle = gl.createBuffer();
  const dispose = () => {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    gl.deleteBuffer(triangle);
  };
  if (!vertex || !fragment || !program || !triangle) { dispose(); return null; }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return null; }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const size = gl.getUniformLocation(program, 'uSize');
  const time = gl.getUniformLocation(program, 'uTime');
  gl.uniform3f(gl.getUniformLocation(program, 'uColor'), ...color);

  return {
    draw(width: number, height: number, seconds: number) {
      const scale = Math.min(1, 700 / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(size, w, h);
      gl.uniform1f(time, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose,
  };
}
