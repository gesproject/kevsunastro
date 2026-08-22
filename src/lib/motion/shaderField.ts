/**
 * Shared WebGL1 engine for the "21st.dev Shader Builder" family -- one
 * fullscreen triangle, a fragment shader supplied by a design brief, and its
 * packed u_scene/u_shape/u_surface/u_finish/u_transform uniforms. /link's
 * fixed Plasma backdrop (PlasmaBackdrop.astro) and Music's section-scoped
 * moss backdrop both run through this, each with their own shader source and
 * uniform values -- the compile/draw/resize/pause plumbing is identical
 * between them, only the ShaderDefinition differs. Neither consumer uses
 * live cursor tracking (both ship with cursor presence fixed at 0), so that
 * half of the original component's uniform surface -- and the pointer
 * listeners that would drive it -- isn't ported here.
 */

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

export interface ShaderDefinition {
  frag: string;
  /** Up to 8 RGB triples (0..1), flattened -- e.g. 4 colours is 12 numbers. */
  colors: number[];
  colorCount: number;
  shape: readonly [number, number, number, number];
  surface: readonly [number, number, number, number];
  finish: readonly [number, number, number, number];
  transform: readonly [number, number, number, number];
  /** Multiplies elapsed seconds before it reaches the shader. Default 1. */
  timeScale?: number;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export interface ShaderFieldHandle {
  /** Section-scoped mounts feed this from an IntersectionObserver so the
   * rAF loop pauses while scrolled off-screen. A fixed full-viewport mount
   * (/link) never calls it, so it stays always-visible. */
  setVisible(visible: boolean): void;
  /** Tears down every listener and stops the rAF loop. Only needed by
   * mounts with their own bfcache reinit; /link's fixed mount has none
   * today and never calls this. */
  dispose(): void;
}

/** Compiles and starts `def`'s shader on `canvas`, returning null if WebGL
 * or compilation is unavailable (caller's CSS gradient floor stands in). */
export function initShaderField(canvas: HTMLCanvasElement, def: ShaderDefinition): ShaderFieldHandle | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, def.frag);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  // Once attached and linked, the standalone shader objects aren't needed —
  // the program keeps what it compiled from them. Deleting them here (not
  // just the program in dispose() below) avoids leaking a pair of shaders
  // every time a section-scoped mount re-inits after a bfcache restore.
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  // One fullscreen triangle — cheaper than a quad and needs no index buffer.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);

  gl.uniform3fv(u("u_colors[0]"), new Float32Array(def.colors));
  gl.uniform4f(u("u_shape"), ...def.shape);
  gl.uniform4f(u("u_surface"), ...def.surface);
  gl.uniform4f(u("u_finish"), ...def.finish);
  gl.uniform4f(u("u_transform"), ...def.transform);
  gl.uniform4f(u("u_space"), 0, 0, 0, 0);
  // Cursor off: presence (the first component) 0 skips every pointer branch
  // in the shader regardless of the other three, so this engine doesn't
  // expose them as config. Neither consumer's own source used a live
  // cursor either -- /link's original inline values here were presence 0
  // too, just with nonzero effect/strength/radius that presence 0 already
  // made unreachable, confirmed by reading every branch that guards on
  // u_cursorPresence in shaders/plasma.ts and shaders/moss.ts.
  gl.uniform4f(u("u_cursor"), 0, 0, 0, 0);
  const sceneLoc = u("u_scene");
  const timeScale = def.timeScale ?? 1;

  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl!.viewport(0, 0, w, h);
  }

  function draw(seconds: number) {
    resize();
    gl!.uniform4f(sceneLoc, width, height, seconds * timeScale, def.colorCount);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    canvas.setAttribute("data-ready", "");
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let startTime = 0;
  let visible = true;

  function loop(now: number) {
    if (!startTime) startTime = now;
    draw((now - startTime) / 1000);
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function sync() {
    stop();
    if (reduced.matches) {
      // Reduced motion still gets the artwork, just frozen.
      draw(0);
    } else if (!document.hidden && visible) {
      startTime = 0;
      frame = requestAnimationFrame(loop);
    }
  }

  // Pausing on a hidden tab (or, for section-scoped mounts, an off-screen
  // canvas) keeps a backgrounded instance off the GPU.
  const onResize = () => {
    if (!frame) draw(0);
  };
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  window.addEventListener("resize", onResize);

  sync();

  return {
    setVisible(next: boolean) {
      if (next === visible) return;
      visible = next;
      sync();
    },
    dispose() {
      stop();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      window.removeEventListener("resize", onResize);
      // A subsequent initShaderField() call on this same canvas (Music's
      // bfcache reinit) gets the same underlying WebGLRenderingContext --
      // getContext() doesn't hand back a fresh one -- so the program and
      // buffer this call compiled must be freed here, or every restore
      // cycle leaks another pair of them on a context that's never torn
      // down. PlasmaBackdrop's fixed /link mount never calls dispose(), so
      // this path was never exercised there.
      gl!.deleteProgram(program);
      gl!.deleteBuffer(buffer);
    },
  };
}
