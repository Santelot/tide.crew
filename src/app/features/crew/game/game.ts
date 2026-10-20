import {
  AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tide } from '../../../shared/tide/tide';
import { Wake } from '../../../shared/wake/wake';
import { CHALLENGE, KEY_DATES, Material, SECTIONS } from './game.content';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'app-game',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Tide, Wake],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements AfterViewInit, OnDestroy {
  protected readonly c = CHALLENGE;
  protected readonly dates = KEY_DATES;
  protected readonly sections = SECTIONS;
  protected readonly active = signal(SECTIONS[0]?.id ?? '');

  protected readonly published = SECTIONS.flatMap((s) => s.items).filter((i) => !!i.href).length;
  protected readonly total = SECTIONS.flatMap((s) => s.items).length;
  protected readonly lastUpdate = SECTIONS.flatMap((s) => s.items)
    .map((i) => i.updated)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  private io?: IntersectionObserver;

  ngAfterViewInit() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) this.active.set(hit.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const s of this.sections) {
      const el = document.getElementById(s.id);
      if (el) this.io.observe(el);
    }
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }

  protected fmt(d?: string): string {
    if (!d) return 'Por anunciar';
    const [y, m, day] = d.split('-').map(Number);
    return `${day} ${MONTHS[m - 1]} ${y}`;
  }

  protected isExternal(m: Material): boolean {
    return !!m.href && /^https?:/.test(m.href);
  }

  protected actionLabel(m: Material): string {
    switch (m.kind) {
      case 'Video': return 'Ver video';
      case 'Formulario': return 'Abrir formulario';
      case 'Enlace': case 'CAD': return 'Abrir';
      default: return 'Descargar';
    }
  }
}
