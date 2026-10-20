import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  inject, signal, viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tide } from '../../../shared/tide/tide';
import { TideService } from '../../../shared/tide/tide.service';
import { Wake } from '../../../shared/wake/wake';
import {
  CONTACT, CREW_TEXT, HERO, SEASON_TEXT, SPONSORS, SPONSOR_TEXT, TEAMS, VALUES,
} from '../crew.content';

@Component({
  selector: 'app-first',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Tide, Wake],
  templateUrl: './first.html',
  styleUrl: './first.scss',
})
export class First implements AfterViewInit, OnDestroy {
  private readonly tide = inject(TideService);
  private off?: () => void;

  protected readonly hero = HERO;
  protected readonly crew = CREW_TEXT;
  protected readonly season = SEASON_TEXT;
  protected readonly sponsorText = SPONSOR_TEXT;
  protected readonly sponsors = SPONSORS;
  protected readonly teams = TEAMS;
  protected readonly values = VALUES;
  protected readonly lead = TEAMS[0];
  protected readonly contact = CONTACT;
  protected readonly mailto =
    `mailto:${CONTACT.email}?subject=${encodeURIComponent('Patrocinio TideCrew')}`;

  /** Flips once after first paint to run the single entrance sequence. */
  protected readonly entered = signal(false);

  private readonly valueEls = viewChildren<ElementRef<HTMLElement>>('val');

  ngAfterViewInit() {
    requestAnimationFrame(() => requestAnimationFrame(() => this.entered.set(true)));
    // A value "goes under" — lights up — once the rising water passes it.
    this.off = this.tide.onFrame((waterY) => {
      for (const { nativeElement: el } of this.valueEls()) {
        const r = el.getBoundingClientRect();
        el.classList.toggle('is-under', r.top + r.height / 2 > waterY);
      }
    });
  }

  ngOnDestroy() {
    this.off?.();
  }
}
