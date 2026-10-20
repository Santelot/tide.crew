import { Injectable, signal } from '@angular/core';
import { DICT, Lang } from './i18n.dictionary';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>('es');

  toggle(): void {
    this.lang.set(this.lang() === 'es' ? 'en' : 'es');
  }

  // Reads the lang signal, so any template calling t() re-renders on toggle.
  t = (key: string): string => {
    const l = this.lang();
    return DICT[l][key] ?? DICT.es[key] ?? key;
  };
}
