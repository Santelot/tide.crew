import { Injectable, signal } from '@angular/core';

/** Lets the page know when the intro has cleared, so the hero entrance plays exactly once, on cue. */
@Injectable({ providedIn: 'root' })
export class IntroService {
  readonly cleared = signal(false);
  /** Show the deep-water intro once per browser session. */
  readonly showLoader = signal(this.firstVisit());

  clear() { this.cleared.set(true); }

  private firstVisit(): boolean {
    try {
      if (sessionStorage.getItem('tc-intro')) return false;
      sessionStorage.setItem('tc-intro', '1');
      return true;
    } catch { return true; }
  }
}
