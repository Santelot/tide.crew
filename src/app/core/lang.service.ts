import { Injectable, effect, signal } from '@angular/core';

export type Lang = 'es' | 'en';

/** Site language for the crew zone. Spanish by default; remembered per visitor. */
@Injectable({ providedIn: 'root' })
export class LangService {
  readonly lang = signal<Lang>(this.initial());

  constructor() {
    effect(() => {
      const l = this.lang();
      document.documentElement.lang = l;
      try { localStorage.setItem('tc-lang', l); } catch { /* storage unavailable */ }
    });
  }

  set(l: Lang) { this.lang.set(l); }

  private initial(): Lang {
    try {
      const saved = localStorage.getItem('tc-lang');
      if (saved === 'es' || saved === 'en') return saved;
    } catch { /* storage unavailable */ }
    return 'es';
  }
}
