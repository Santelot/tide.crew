import { Injectable, signal } from '@angular/core';

/**
 * What the ocean knows about the visitor's position, shared with the cursor
 * and the sound so they all agree on how deep we are.
 *   depth: 0 = dry land / surface, 1 = the deepest water on the page.
 *   wet:   true while the centre of the screen is underwater.
 */
@Injectable({ providedIn: 'root' })
export class OceanService {
  readonly depth = signal(0);
  readonly wet = signal(false);
}
