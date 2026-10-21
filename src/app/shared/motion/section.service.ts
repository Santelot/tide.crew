import { Injectable, signal } from '@angular/core';

/** Which landing section is in view, shared by the page rail and the top nav. */
@Injectable({ providedIn: 'root' })
export class SectionService {
  readonly active = signal('');
}
