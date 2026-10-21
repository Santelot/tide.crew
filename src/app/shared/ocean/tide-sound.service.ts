import { Injectable, effect, inject, signal } from '@angular/core';
import { OceanService } from './ocean.service';

/**
 * An optional, fully synthesized soundscape (no audio files):
 *  - above water: distant surf, breathing in slow swells;
 *  - underwater: the same sea, muffled more the deeper you go;
 *  - a soft "bloop" when you tap the water.
 * Off by default. Browsers only allow audio after a click, so the toggle is that click.
 */
@Injectable({ providedIn: 'root' })
export class TideSound {
  private readonly ocean = inject(OceanService);
  readonly on = signal(false);

  private ctx?: AudioContext;
  private master?: GainNode;
  private filter?: BiquadFilterNode;
  private body?: GainNode;

  constructor() {
    effect(() => {
      const wet = this.ocean.wet();
      const d = this.ocean.depth();
      if (!this.ctx || !this.filter || !this.body) return;
      const now = this.ctx.currentTime;
      const cutoff = wet ? 820 - d * 620 : 2600;
      this.filter.frequency.setTargetAtTime(cutoff, now, 0.35);
      this.body.gain.setTargetAtTime(wet ? 0.95 : 0.6, now, 0.5);
    });
  }

  toggle() {
    if (!this.on()) this.start();
    else this.stop();
  }

  /** A bubble: a quick falling sine, lower in deep water. */
  bloop(depth = 0) {
    if (!this.on() || !this.ctx || !this.master) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    const f0 = 640 - depth * 300;
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.42, now + 0.16);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.connect(g).connect(this.master);
    o.start(now); o.stop(now + 0.25);
  }

  private start() {
    try {
      if (!this.ctx) this.build();
      this.ctx!.resume();
      this.master!.gain.setTargetAtTime(0.5, this.ctx!.currentTime, 0.6);
      this.on.set(true);
    } catch { /* audio not available */ }
  }

  private stop() {
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    this.on.set(false);
  }

  private build() {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    const c: AudioContext = new AC();
    this.ctx = c;
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.master.connect(c.destination);

    // Four seconds of pink-ish noise, looped: the raw sea.
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
      }
    }
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;

    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2600;
    this.filter.Q.value = 0.5;

    // Swells: a slow LFO breathing the volume in and out.
    const swell = c.createGain();
    swell.gain.value = 0.55;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 0.4;
    lfo.connect(lfoDepth).connect(swell.gain);

    this.body = c.createGain();
    this.body.gain.value = 0.6;

    src.connect(this.filter).connect(swell).connect(this.body).connect(this.master);
    src.start(); lfo.start();
  }
}
