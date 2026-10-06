import { vertex, cursor, decay, grid } from './shaders/index.js';
import { defaultConfig as config } from './config.js';
const mounted = new WeakMap();

/** Mount a transparent mouse-driven effect. The container must have a nonzero size. */
export function createParticleEffect(container, options = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('A container element is required.');
  if (mounted.has(container)) return mounted.get(container);
  const color = options.particleColor;
  if (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) {
    throw new TypeError('particleColor must be a six-digit hex color.');
  }
  let cursorColor = color === undefined ? config.cursorColor : [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
  const opacity = options.opacity ?? 1;
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new TypeError('opacity must be between 0 and 1.');
  const canvas = document.createElement('canvas');
  // Composite the original per-pixel alpha without changing its structural fades.
  canvas.style.opacity = String(opacity);
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none', background: 'transparent' });
  const previousPosition = container.style.position;
  const needsPosition = getComputedStyle(container).position === 'static';
  if (needsPosition) container.style.position = 'relative';
  container.appendChild(canvas);

  let gl, destroyed = false, frameId = null, observer, dprQuery;
  let targets = [], index = 0, width = 0, height = 0, ratio = 0, fieldWidth, fieldHeight;
  let last, current, lastTime = 0, lastCursorTime = 0;
  let inject, fade, display, quad, empty;
  const resources = { shaders: new Set(), programs: new Set(), buffers: new Set(), textures: new Set(), framebuffers: new Set() };

  function setColor(value) {
    if (destroyed) return;
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new TypeError('particleColor must be a six-digit hex color.');
    cursorColor = [1, 3, 5].map(start => parseInt(value.slice(start, start + 2), 16));
  }

  function setOpacity(value) {
    if (destroyed) return;
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new TypeError('opacity must be between 0 and 1.');
    canvas.style.opacity = String(value);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    mounted.delete(container);
    if (frameId !== null) cancelAnimationFrame(frameId);
    observer?.disconnect();
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', resize);
    dprQuery?.removeEventListener('change', handleDprChange);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    if (gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      for (const resource of resources.framebuffers) gl.deleteFramebuffer(resource);
      for (const resource of resources.textures) gl.deleteTexture(resource);
      for (const resource of resources.buffers) gl.deleteBuffer(resource);
      gl.useProgram(null);
      for (const resource of resources.programs) gl.deleteProgram(resource);
      for (const resource of resources.shaders) gl.deleteShader(resource);
      for (const set of Object.values(resources)) set.clear();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    targets = [];
    canvas.remove();
    if (needsPosition && container.style.position === 'relative') container.style.position = previousPosition;
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to create shader.');
    resources.shaders.add(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function program(fragment) {
    const p = gl.createProgram();
    if (!p) throw new Error('Unable to create program.');
    resources.programs.add(p);
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.deleteShader(vs); gl.deleteShader(fs);
    resources.shaders.delete(vs); resources.shaders.delete(fs);
    return { p, locations: new Map() };
  }
  function use(p) {
    gl.useProgram(p.p); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = gl.getAttribLocation(p.p, 'a_position');
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(loc); gl.disable(gl.BLEND);
  }
  function location(p, name) {
    if (!p.locations.has(name)) p.locations.set(name, gl.getUniformLocation(p.p, name));
    return p.locations.get(name);
  }
  function uniform(p, name, value) {
    const loc = location(p, name);
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (value.length === 2) gl.uniform2fv(loc, value);
    else gl.uniform3fv(loc, value);
  }
  function sampler(p, name, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(location(p, name), unit);
  }
  function target(w, h) {
    const texture = gl.createTexture(); resources.textures.add(texture);
    gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, w, h, 0, gl.RG, gl.HALF_FLOAT, null);
    for (const key of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, key, gl.LINEAR);
    for (const key of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, key, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer(); resources.framebuffers.add(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Unable to create floating-point framebuffer.');
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo };
  }
  function resize() {
    if (destroyed) return;
    const nextWidth = container.clientWidth, nextHeight = container.clientHeight, nextRatio = devicePixelRatio;
    if (nextWidth === width && nextHeight === height && nextRatio === ratio) return;
    width = nextWidth; height = nextHeight; ratio = nextRatio;
    canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
    for (const t of targets) {
      gl.deleteFramebuffer(t.fbo); resources.framebuffers.delete(t.fbo);
      gl.deleteTexture(t.texture); resources.textures.delete(t.texture);
    }
    targets = []; index = 0; last = current = undefined;
    if (!width || !height) return;
    fieldWidth = Math.max(1, Math.floor(ratio * width / config.fieldScale));
    fieldHeight = Math.max(1, Math.floor(ratio * height / config.fieldScale));
    targets = [target(fieldWidth, fieldHeight), target(fieldWidth, fieldHeight)];
    renderDisplay(0);
  }
  function step(p, inputName) {
    use(p); sampler(p, inputName, targets[index].texture, 0); index = (index + 1) % 2;
    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[index].fbo); gl.viewport(0, 0, fieldWidth, fieldHeight); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function renderDisplay(time) {
    use(display); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT);
    // Transparent output is the only rendering change. The host supplies its background.
    const values = { u_resolution: [width, height], u_size: [width, height], u_content_dimensions: [width, height], u_position: [0, 0], u_pixel_size: config.pixelSize, u_scale: 1, u_reveal_progress: 1, u_theme: [0, 0, 0], u_content_theme: [0, 0, 0], u_cursor_theme: cursorColor, u_transparent: 1, u_render_content: 0, u_nogrid: 0, u_nogrid_progress: 0, u_nocursor: 0, u_distort_content: 0, u_mirror: 0, u_time: time, u_scroll: 0, u_parallax_progress: 0 };
    for (const [name, value] of Object.entries(values)) uniform(display, name, value);
    sampler(display, 'u_cursor', targets[index].texture, 0); sampler(display, 'u_content', empty, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function handleMouseMove(e) {
    if (destroyed || !targets.length) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / container.offsetWidth, scaleY = rect.height / container.offsetHeight;
    const x = (e.clientX - rect.left) / scaleX - container.clientLeft;
    const y = (e.clientY - rect.top) / scaleY - container.clientTop;
    if (x < 0 || y < 0 || x > width || y > height) { last = current = undefined; return; }
    last = current; current = [x, height - y];
    if (!last) return;
    const vector = [current[0] - last[0], current[1] - last[1]];
    use(inject); uniform(inject, 'u_resolution', [width, height]); uniform(inject, 'u_vector', vector); uniform(inject, 'u_cursor', current);
    step(inject, 'u_velocity'); lastCursorTime = lastTime;
  }
  function tick(time) {
    if (destroyed) return;
    if (targets.length) {
      if (lastTime - lastCursorTime < config.stopAfter) { use(fade); uniform(fade, 'u_delta', time - lastTime); step(fade, 'u_previous'); }
      renderDisplay(time);
    }
    lastTime = time; frameId = requestAnimationFrame(tick);
  }
  function handleDprChange() { resize(); watchDpr(); }
  function watchDpr() {
    dprQuery?.removeEventListener('change', handleDprChange);
    dprQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', handleDprChange);
  }
  function handleContextLost(event) { event.preventDefault(); destroy(); }

  try {
    gl = canvas.getContext('webgl2', { alpha: true });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('WebGL2 with floating-point color buffers is required.');
    gl.clearColor(0, 0, 0, 0); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    inject = program(cursor); fade = program(decay); display = program(grid);
    quad = gl.createBuffer(); resources.buffers.add(quad); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    empty = gl.createTexture(); resources.textures.add(empty); gl.bindTexture(gl.TEXTURE_2D, empty);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    resize(); observer = new ResizeObserver(resize); observer.observe(container); watchDpr();
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('resize', resize);
    canvas.addEventListener('webglcontextlost', handleContextLost); frameId = requestAnimationFrame(tick);
    const instance = Object.freeze({ canvas, destroy, setColor, setOpacity });
    mounted.set(container, instance);
    return instance;
  } catch (error) { destroy(); throw error; }
}
