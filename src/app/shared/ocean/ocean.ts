import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, inject, viewChild,
} from '@angular/core';
import { IntroService } from '../motion/intro.service';
import { OceanService } from './ocean.service';

/**
 * The ocean behind the landing.
 *
 * One fixed, full-screen WebGL canvas sits behind the page. Sections marked as
 * water are transparent, so wherever one scrolls into view the ocean shows
 * through: a living surface at its top edge, light that fades as you go deeper,
 * drifting plankton that glows around the cursor in the dark, ripples and
 * bubbles where you touch it, and a surface that gets choppy when you scroll fast.
 */
export interface OceanBand {
  el: HTMLElement;
  /** Draw a live surface at the top edge (the section above is dry). */
  surface: boolean;
  /** 0 shallow · 1 dives into the deep · 2 rises back up from the deep. */
  palette: 0 | 1 | 2;
}

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uDpr;
uniform vec4  uBand[3];
uniform vec3  uMouse;
uniform vec4  uRip[8];
uniform float uChop;
uniform float uScroll;
uniform float uVel;

const vec3 PACIFIC  = vec3(0.0, 0.651, 0.722);
const vec3 CREST    = vec3(0.0, 0.812, 0.902);
const vec3 FOAM     = vec3(1.0, 0.984, 0.996);
const vec3 UNDERTOW = vec3(0.0, 0.263, 0.290);
const vec3 NIGHT    = vec3(0.067, 0.098, 0.129);
// Pacific pulled a quarter of the way toward Undertow: white text keeps its contrast.
const vec3 SEA      = vec3(0.0, 0.554, 0.614);

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float cellEdge(vec2 p, float t){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(i + g);
      o = 0.5 + 0.42 * sin(t + 6.2831 * o);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return d2 - d1;
}

float swell(float x, float H, float t){
  float u = x / H;
  float c = uChop;
  // Speed stays constant (a changing speed would jump the phase); scrolling only lifts the waves.
  return H * ((0.009 + c * 0.010) * sin(u * 6.0 + t * 0.85)
            + (0.005 + c * 0.007) * sin(u * 13.0 - t * 1.25 + 1.7)
            + 0.002 * sin(u * 29.0 + t * 2.1));
}

vec3 palette(float pal, float d, float H, out float dark){
  if (pal < 0.5) {
    float k = smoothstep(0.0, 2.2 * H, d);
    dark = 0.12 * k;
    return mix(SEA, vec3(0.0, 0.48, 0.54), k);
  }
  if (pal < 1.5) {
    float k1 = smoothstep(0.0, 0.55 * H, d);
    float k2 = smoothstep(0.35 * H, 1.15 * H, d);
    dark = 0.4 * k1 + 0.6 * k2;
    return mix(mix(SEA, UNDERTOW, k1), NIGHT, k2);
  }
  float r1 = smoothstep(0.0, 0.3 * H, d);
  float r2 = smoothstep(0.15 * H, 0.95 * H, d);
  dark = 1.0 - 0.35 * r1 - 0.65 * r2;
  return mix(mix(NIGHT, UNDERTOW, r1), SEA, r2);
}

void main(){
  float H = uRes.y;
  float X = gl_FragCoord.x;
  float Y = uRes.y - gl_FragCoord.y;     // px from the top of the screen
  float t = uTime;
  vec2  P = vec2(X, Y);

  // Which water band is this pixel in?
  float top = 0.0, bottom = -1.0, hasSurf = 0.0, pal = 0.0;
  for (int k = 0; k < 3; k++) {
    vec4 b = uBand[k];
    if (b.y > b.x && Y >= b.x && Y <= b.y) { top = b.x; bottom = b.y; hasSurf = b.z; pal = b.w; }
  }
  if (bottom < 0.0) { gl_FragColor = vec4(0.0); return; }

  // Ripples bend the light and lift the surface.
  vec2 bend = vec2(0.0);
  float glow = 0.0, lift = 0.0;
  for (int k = 0; k < 8; k++) {
    vec4 r = uRip[k];
    if (r.w <= 0.0) continue;
    float age = t - r.z;
    if (age < 0.0 || age > 4.5) continue;
    vec2 dv = (P - r.xy) / H;
    float d = length(dv);
    float front = age * 0.30;
    float band = exp(-pow((d - front) * 20.0, 2.0));
    float decay = exp(-age * 1.15) * r.w;
    bend += (dv / max(d, 1e-4)) * sin((d - front) * 64.0) * band * decay * 0.014;
    glow += band * decay;
    float dx = abs(X - r.x) / H;
    lift += decay * 0.018 * H * exp(-pow((dx - front) * 13.0, 2.0)) * exp(-abs(r.y - top) / (0.12 * H));
  }

  // The surface (only where the section above is dry).
  float s = top - 2.0;
  if (hasSurf > 0.5) s = top + 64.0 * uDpr + swell(X, H, t) - lift;
  float e = Y - s;                                     // > 0 is underwater
  float aa = 1.2 * uDpr;
  float water = hasSurf > 0.5 ? smoothstep(-aa, aa, e) : 1.0;
  float line  = hasSurf > 0.5 ? 1.0 - smoothstep(0.0, 1.8 * aa, abs(e)) : 0.0;
  if (water <= 0.0 && line <= 0.0) { gl_FragColor = vec4(0.0); return; }

  float d = max(e, 0.0);
  float dark;
  vec3 col = palette(pal, d, H, dark);
  float light = 1.0 - dark;

  // Caustics, with a little parallax so they feel like light on moving water.
  vec2 q = vec2(X, Y + uScroll * 0.12) / H * 4.6 + bend * 46.0;
  q += 0.42 * vec2(sin(q.y * 0.9 + t * 0.35), cos(q.x * 0.8 - t * 0.3));
  q += 0.18 * vec2(sin(q.y * 2.3 - t * 0.5), cos(q.x * 2.1 + t * 0.45));
  float c1 = pow(1.0 - smoothstep(0.0, 0.10, cellEdge(q, t * 0.85)), 3.0);
  float c2 = pow(1.0 - smoothstep(0.0, 0.07, cellEdge(q * 1.75 + 3.1, t * 1.15)), 3.0);
  float c = (c1 * 0.62 + c2 * 0.38) * light * light;
  col = mix(col, CREST, clamp(c * 0.42 + glow * 0.3, 0.0, 1.0));
  col = mix(col, FOAM, c * c * 0.13);

  // Sunlight shafts, strongest just under the surface.
  float ang = (X * 0.55 + Y * 0.22) / H;
  float ray = pow(0.5 + 0.5 * sin(ang * 9.0 + sin(ang * 2.3 + t * 0.21) * 1.6 + t * 0.12), 7.0)
            * (0.55 + 0.45 * sin(ang * 3.1 - t * 0.27));
  col += FOAM * ray * 0.075 * exp(-d / (0.55 * H)) * light;

  // The cursor carries a little light; in the deep it is the only light there is.
  float dm = length(P - uMouse.xy);
  float halo = exp(-pow(dm / (240.0 * uDpr), 2.0)) * uMouse.z;
  col += CREST * halo * (0.04 + 0.16 * dark);

  // Plankton: three parallax layers drifting up; they glow when the cursor is near.
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float cell = (64.0 + fl * 42.0) * uDpr;
    vec2 w = vec2(X + fl * 37.0 * uDpr, Y + uScroll * (0.25 + fl * 0.22) + t * (9.0 + fl * 7.0) * uDpr);
    vec2 id = floor(w / cell);
    vec2 h = hash2(id + fl * 13.1);
    if (h.x > 0.62) continue;
    vec2 pos = (0.18 + 0.64 * hash2(id * 1.7 + 4.2)) * cell
             + vec2(sin(t * 0.6 + h.y * 6.28) * 6.0 * uDpr, 0.0);
    vec2 dd = (w - id * cell) - pos;
    dd.y /= 1.0 + abs(uVel) * 7.0;
    float r = (0.8 + h.y * 1.3 + fl * 0.35) * uDpr;
    float a = 1.0 - smoothstep(r * 0.35, r, length(dd));
    float near = exp(-pow(dm / (190.0 * uDpr), 2.0)) * uMouse.z;
    vec3 pc = mix(FOAM, CREST, dark);
    col += pc * a * (0.07 + 0.22 * dark + near * (0.35 + 1.4 * dark)) * (0.6 + 0.4 * sin(t * 1.3 + h.y * 9.0));
  }

  // Bubbles rising from where someone tapped the water.
  for (int k = 0; k < 8; k++) {
    vec4 r = uRip[k];
    if (r.w < 1.0) continue;
    float age = t - r.z;
    if (age < 0.0 || age > 3.4) continue;
    float fade = 1.0 - smoothstep(2.3, 3.4, age);
    for (int i = 0; i < 6; i++) {
      vec2 hb = hash2(vec2(float(k) * 7.0 + float(i), r.z * 3.1));
      vec2 bp = r.xy + vec2((hb.x - 0.5) * 70.0 * uDpr + sin(age * 3.0 + hb.y * 6.0) * 9.0 * uDpr,
                            -age * (70.0 + hb.y * 110.0) * uDpr - hb.x * 10.0 * uDpr);
      if (hasSurf > 0.5 && bp.y < s + 6.0 * uDpr) continue;
      float br = (2.5 + hb.y * 6.0) * uDpr;
      float db = length(P - bp);
      float ring = 1.0 - smoothstep(0.0, 1.4 * uDpr, abs(db - br));
      float spec = 1.0 - smoothstep(0.0, br * 0.32, length(P - bp + vec2(br * 0.38, br * 0.38)));
      col = mix(col, FOAM, (ring * 0.75 + spec * 0.8) * fade);
    }
  }

  // A crest-tinted lip and a foam line at the surface.
  float lip = (1.0 - smoothstep(0.0, 0.035 * H, e)) * water * hasSurf;
  col = mix(col, CREST, lip * 0.4);
  vec3 outCol = mix(col, FOAM, line * (1.0 - water) + line * 0.55 * water);
  float alpha = max(water, line * 0.95);
  gl_FragColor = vec4(outCol * alpha, alpha);
}
`;

@Component({
  selector: 'tc-ocean',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<canvas #cv></canvas>`,
  styles: [`
    :host { position: fixed; inset: 0; z-index: -1; display: block; pointer-events: none; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  `],
})
export class Ocean implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly intro = inject(IntroService);
  private readonly state = inject(OceanService);
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  /** Called when someone taps the water (the sound layer listens). */
  onSplash?: (depth: number) => void;
  /** True once WebGL is up; until then the page keeps its painted backgrounds. */
  ready = false;

  private bands: OceanBand[] = [];
  private gl: WebGLRenderingContext | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private t0 = performance.now();
  private dpr = 1;
  private quality = 1;
  private slow = 0;
  private lastFrame = 0;
  private drewLast = true;
  private ripples = new Float32Array(32);
  private next = 0;
  private bandBuf = new Float32Array(12);
  private mouse = { x: -9999, y: -9999, on: 0, target: 0 };
  private lastRippleAt = 0;
  private lastY = scrollY;
  private chop = 0;
  private vel = 0;
  private readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly finePointer = matchMedia('(pointer: fine)').matches;

  setBands(b: OceanBand[]) { this.bands = b.slice(0, 3); }

  ngAfterViewInit() { this.zone.runOutsideAngular(() => this.init()); }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('pointermove', this.onMove);
    removeEventListener('pointerdown', this.onDown);
    removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVis);
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    this.state.wet.set(false);
    this.state.depth.set(0);
  }

  // ── Input ────────────────────────────────────────────────────────
  private onMove = (ev: PointerEvent) => {
    this.mouse.x = ev.clientX; this.mouse.y = ev.clientY;
    const hit = this.hit(ev.clientX, ev.clientY);
    this.mouse.target = hit ? (this.finePointer ? 1 : 0.7) : 0;
    // Brushing the surface makes it ripple.
    const now = performance.now();
    if (hit?.nearSurface && now - this.lastRippleAt > 90) {
      this.lastRippleAt = now;
      this.addRipple(ev.clientX, Math.max(ev.clientY, hit.surfaceY + 4), 0.55);
    }
  };

  private onDown = (ev: PointerEvent) => {
    const hit = this.hit(ev.clientX, ev.clientY);
    if (!hit || ev.clientY < hit.surfaceY - 30) return;
    this.addRipple(ev.clientX, Math.max(ev.clientY, hit.surfaceY + 4), 1.4);
    this.onSplash?.(hit.depth);
  };

  private onResize = () => this.resize();
  private onVis = () => this.kick();

  /** Is a screen point inside a water band? */
  private hit(_x: number, y: number) {
    for (const b of this.bands) {
      const r = b.el.getBoundingClientRect();
      if (y < r.top || y > r.bottom) continue;
      const surfaceY = b.surface ? r.top + 64 : r.top;
      const d = Math.max(0, y - surfaceY);
      return { surfaceY, nearSurface: b.surface && Math.abs(y - surfaceY) < 46, depth: this.darkAt(b.palette, d) };
    }
    return null;
  }

  private addRipple(clientX: number, clientY: number, strength: number) {
    const i = this.next * 4;
    this.ripples[i] = clientX * this.dpr;
    this.ripples[i + 1] = clientY * this.dpr;
    this.ripples[i + 2] = this.time();
    this.ripples[i + 3] = strength;
    this.next = (this.next + 1) % 8;
  }

  /** Mirrors the shader's palette darkness, so cursor and sound agree with the pixels. */
  private darkAt(pal: number, d: number) {
    const H = innerHeight;
    const ss = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    if (pal === 0) return 0.12 * ss(0, 2.2 * H, d);
    if (pal === 1) return 0.4 * ss(0, 0.55 * H, d) + 0.6 * ss(0.35 * H, 1.15 * H, d);
    return 1 - 0.35 * ss(0, 0.3 * H, d) - 0.65 * ss(0.15 * H, 0.95 * H, d);
  }

  // ── GL ───────────────────────────────────────────────────────────
  private init() {
    const canvas = this.cv().nativeElement;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return;
    const prog = this.program(gl);
    if (!prog) return;
    this.gl = gl;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uTime', 'uDpr', 'uBand', 'uMouse', 'uRip', 'uChop', 'uScroll', 'uVel']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.clearColor(0, 0, 0, 0);

    addEventListener('pointermove', this.onMove, { passive: true });
    addEventListener('pointerdown', this.onDown, { passive: true });
    addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVis);
    this.resize();
    this.kick();
    this.ready = true;
  }

  private resize() {
    const gl = this.gl; if (!gl) return;
    const c = this.cv().nativeElement;
    const small = innerWidth < 760;
    this.dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5) * this.quality;
    const w = Math.max(1, Math.round(innerWidth * this.dpr));
    const h = Math.max(1, Math.round(innerHeight * this.dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(this.u['uRes'], w, h);
    gl.uniform1f(this.u['uDpr'], this.dpr);
  }

  kick() {
    cancelAnimationFrame(this.raf);
    if (!this.gl || document.hidden) return;
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.intro.cleared()) return;
      this.adapt(now);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  private adapt(now: number) {
    const dt = this.lastFrame ? now - this.lastFrame : 16;
    this.lastFrame = now;
    if (!this.drewLast) return;
    if (dt > 26 && dt < 400) this.slow++;
    else if (this.slow > 0) this.slow -= 0.25;
    if (this.slow > 24 && this.quality > 0.5) {
      this.quality = Math.max(0.5, this.quality - 0.25);
      this.slow = 0;
      this.resize();
    }
  }

  /** Water time runs at 75% of real time: a calmer sea. */
  private time() { return this.reduced ? 3.0 : (performance.now() - this.t0) / 1000 * 0.75; }

  private frame() {
    const gl = this.gl!;
    const H = innerHeight;

    // Scroll speed drives the chop; the surface calms down on its own.
    const y = scrollY;
    const dy = y - this.lastY;
    this.lastY = y;
    if (!this.reduced) {
      this.vel += (Math.max(-1, Math.min(1, dy / 60)) - this.vel) * 0.15;
      // Waves build up gently and settle slowly: no sudden jumps.
      this.chop += (Math.min(1, Math.abs(dy) / 60) - this.chop) * (Math.abs(dy) > 2 ? 0.04 : 0.02);
    }
    // Ripples live in screen space: carry them along with the page.
    if (dy !== 0) for (let k = 0; k < 8; k++) this.ripples[k * 4 + 1] -= dy * this.dpr;

    // Bands on screen right now.
    let any = false;
    let centreDepth = 0, centreWet = false;
    this.bandBuf.fill(0);
    this.bands.forEach((b, k) => {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) return;
      any = true;
      this.bandBuf.set([r.top * this.dpr, r.bottom * this.dpr, b.surface ? 1 : 0, b.palette], k * 4);
      const sy = b.surface ? r.top + 64 : r.top;
      if (H / 2 >= sy && H / 2 <= r.bottom) { centreWet = true; centreDepth = this.darkAt(b.palette, H / 2 - sy); }
    });

    if (Math.abs(centreDepth - this.state.depth()) > 0.02 || centreWet !== this.state.wet()) {
      this.zone.run(() => { this.state.depth.set(centreDepth); this.state.wet.set(centreWet); });
    }

    if (!any) {
      if (this.drewLast) { gl.clear(gl.COLOR_BUFFER_BIT); this.drewLast = false; }
      return;
    }
    this.drewLast = true;

    this.mouse.on += (this.mouse.target - this.mouse.on) * 0.08;
    gl.uniform1f(this.u['uTime'], this.time());
    gl.uniform4fv(this.u['uBand'], this.bandBuf);
    gl.uniform3f(this.u['uMouse'], this.mouse.x * this.dpr, this.mouse.y * this.dpr, this.mouse.on);
    gl.uniform4fv(this.u['uRip'], this.ripples);
    gl.uniform1f(this.u['uChop'], this.chop);
    gl.uniform1f(this.u['uScroll'], y * this.dpr);
    gl.uniform1f(this.u['uVel'], this.vel);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private program(gl: WebGLRenderingContext): WebGLProgram | null {
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[tc-ocean]', gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, VERT), f = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('[tc-ocean]', gl.getProgramInfoLog(p)); return null; }
    return p;
  }
}
