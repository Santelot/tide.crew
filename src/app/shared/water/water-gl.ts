import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy,
  effect, inject, signal, viewChild,
} from '@angular/core';
import { IntroService } from '../motion/intro.service';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/*
 * Daylight water. Everything above the surface is transparent so the page
 * shows through; below it, Pacific Blue with a moving caustic light network
 * (animated Worley cell edges) and ripple rings wherever someone touches it.
 */
const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uLevel;
uniform float uPx;
uniform vec4  uRip[8];
varying vec2 vUv;

const vec3 PACIFIC = vec3(0.0, 0.651, 0.722);
const vec3 CREST   = vec3(0.0, 0.812, 0.902);
const vec3 FOAM    = vec3(1.0, 0.984, 0.996);

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

float swell(float x, float t){
  return 0.011 * sin(x * 6.0 + t * 0.85)
       + 0.006 * sin(x * 13.0 - t * 1.25 + 1.7)
       + 0.0022 * sin(x * 29.0 + t * 2.1);
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  vec2 bend = vec2(0.0);
  float glow = 0.0;
  float lift = 0.0;
  for (int k = 0; k < 8; k++) {
    vec4 r = uRip[k];
    if (r.w <= 0.0) continue;
    float age = t - r.z;
    if (age < 0.0 || age > 4.5) continue;
    vec2 rp = vec2(r.x * aspect, r.y);
    vec2 dv = p - rp;
    float d = length(dv);
    float front = age * 0.30;
    float band = exp(-pow((d - front) * 20.0, 2.0));
    float decay = exp(-age * 1.15) * r.w;
    float w = sin((d - front) * 64.0) * band * decay;
    bend += (dv / max(d, 1e-4)) * w * 0.014;
    glow += band * decay;
    float dx = abs(p.x - rp.x);
    lift += decay * 0.020 * exp(-pow((dx - front) * 13.0, 2.0)) * exp(-abs(r.y - uLevel) * 6.0);
  }

  float surface = uLevel + swell(p.x, t) + lift;
  float e = uv.y - surface;            // < 0 is underwater
  float px = uPx / uRes.y;
  float water = 1.0 - smoothstep(-px, px, e);
  float line = 1.0 - smoothstep(0.0, 1.6 * px, abs(e));
  if (water <= 0.0 && line <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec2 q = p * 4.6 + bend * 46.0;
  q += 0.42 * vec2(sin(q.y * 0.9 + t * 0.35), cos(q.x * 0.8 - t * 0.3));
  q += 0.18 * vec2(sin(q.y * 2.3 - t * 0.5), cos(q.x * 2.1 + t * 0.45));
  float c1 = pow(1.0 - smoothstep(0.0, 0.10, cellEdge(q, t * 0.85)), 3.0);
  float c2 = pow(1.0 - smoothstep(0.0, 0.07, cellEdge(q * 1.75 + 3.1, t * 1.15)), 3.0);
  float depth = clamp(-e, 0.0, 1.0);
  float c = (c1 * 0.62 + c2 * 0.38) * mix(1.0, 0.35, smoothstep(0.0, 0.85, depth));

  vec3 col = PACIFIC;
  col = mix(col, CREST, clamp(c * 0.5 + glow * 0.3, 0.0, 1.0));
  col = mix(col, FOAM, c * c * 0.16);
  float lip = (1.0 - smoothstep(0.0, 0.035, -e)) * water;
  col = mix(col, CREST, lip * 0.45);

  vec3 outCol = mix(col, FOAM, line * (1.0 - water) + line * 0.55 * water);
  float a = max(water, line * 0.95);
  gl_FragColor = vec4(outCol * a, a);
}
`;

@Component({
  selector: 'tc-water',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-fallback]': 'fallback()' },
  template: `
    <canvas #cv></canvas>
    @if (fallback()) { <div class="fb" [style.height.%]="fbLevel() * 100"></div> }
  `,
  styles: [`
    :host { position: absolute; inset: 0; display: block; pointer-events: none; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .fb { position: absolute; left: 0; right: 0; bottom: 0; background: var(--tc-pacific); border-top: 2px solid var(--tc-foam); transition: height .2s linear; }
  `],
})
export class WaterGl implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly intro = inject(IntroService);

  /** Render scale, lowered automatically on devices that can't keep up. */
  private quality = 1;
  private slowFrames = 0;
  private lastFrame = 0;

  constructor() {
    // Nothing to see under the intro panel — start rendering once it lifts.
    effect(() => { if (this.intro.cleared()) this.kick(); });
  }

  protected readonly fallback = signal(false);
  protected readonly fbLevel = signal(0.3);

  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private t0 = performance.now();
  private level = 0;
  private visible = true;
  private ripples = new Float32Array(32);
  private next = 0;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private onVis = () => this.kick();

  /** 0 = empty, 1 = the whole canvas is underwater. */
  setLevel(v: number) {
    const changed = Math.abs(v - this.level) > 0.0005;
    this.level = v;
    // Reduced motion draws on demand instead of every frame.
    if (this.reduced && changed && this.gl && this.intro.cleared()) this.frame();
    if (this.fallback()) this.fbLevel.set(Math.max(0, Math.min(1, v)));
  }

  /** Surface height in px from the top of the canvas, at a horizontal fraction. */
  surfacePx(xFrac = 0.5): number {
    const r = this.host.nativeElement.getBoundingClientRect();
    const t = (performance.now() - this.t0) / 1000;
    const x = xFrac * (r.width / Math.max(1, r.height));
    const swell = 0.011 * Math.sin(x * 6 + t * 0.85) + 0.006 * Math.sin(x * 13 - t * 1.25 + 1.7);
    return r.height * (1 - (this.level + swell));
  }

  /** Drop a ripple at client coordinates. */
  touch(clientX: number, clientY: number, strength = 1) {
    const r = this.host.nativeElement.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = 1 - (clientY - r.top) / r.height;
    if (y > this.level + 0.04) return; // only the water ripples
    const i = this.next * 4;
    this.ripples[i] = x;
    this.ripples[i + 1] = Math.min(y, this.level);
    this.ripples[i + 2] = (performance.now() - this.t0) / 1000;
    this.ripples[i + 3] = strength;
    this.next = (this.next + 1) % 8;
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => this.init());
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    const lose = this.gl?.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  }

  private init() {
    const canvas = this.cv().nativeElement;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) { this.zone.run(() => this.fallback.set(true)); return; }
    const prog = this.program(gl);
    if (!prog) { this.zone.run(() => this.fallback.set(true)); return; }
    this.gl = gl; this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uTime', 'uLevel', 'uPx', 'uRip']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.clearColor(0, 0, 0, 0);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.host.nativeElement);
    this.resize();
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.kick(); });
    this.io.observe(this.host.nativeElement);
    document.addEventListener('visibilitychange', this.onVis);
    this.kick();
  }

  private resize() {
    const gl = this.gl; if (!gl) return;
    const c = this.cv().nativeElement;
    const small = innerWidth < 760;
    const dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5) * this.quality;
    const w = Math.max(1, Math.round(c.clientWidth * dpr));
    const h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(this.u['uRes'], w, h);
    gl.uniform1f(this.u['uPx'], dpr * 1.2);
    if (this.reduced) this.frame();
  }

  private kick() {
    cancelAnimationFrame(this.raf);
    if (!this.gl || document.hidden || !this.visible || !this.intro.cleared()) return;
    if (this.reduced) { this.frame(); return; }
    const loop = (now: number) => {
      this.adapt(now);
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** If frames keep landing late, render the water at a lower resolution. */
  private adapt(now: number) {
    const dt = this.lastFrame ? now - this.lastFrame : 16;
    this.lastFrame = now;
    if (dt > 26 && dt < 400) this.slowFrames++;
    else if (this.slowFrames > 0) this.slowFrames -= 0.25;
    if (this.slowFrames > 24 && this.quality > 0.5) {
      this.quality = Math.max(0.5, this.quality - 0.25);
      this.slowFrames = 0;
      this.resize();
    }
  }

  private frame() {
    const gl = this.gl; if (!gl) return;
    const t = this.reduced ? 2.0 : (performance.now() - this.t0) / 1000;
    gl.uniform1f(this.u['uTime'], t);
    gl.uniform1f(this.u['uLevel'], this.level);
    gl.uniform4fv(this.u['uRip'], this.ripples);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private program(gl: WebGLRenderingContext): WebGLProgram | null {
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[tc-water]', gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, VERT), f = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('[tc-water]', gl.getProgramInfoLog(p)); return null; }
    return p;
  }
}
