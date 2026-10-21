import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Question, sectionLabel } from './qa.service';

/** One question with its official answer, the way it reads on the public list. */
@Component({
  selector: 'tc-qa-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let q = item();
    <article class="card" [class.is-declined]="q.status === 'declined'" [class.is-pending]="q.status === 'pending'" [class.compact]="compact()">
      <header class="meta">
        @if (q.number) { <span class="num">Q{{ q.number }}</span> } @else { <span class="num num--wait">En espera</span> }
        <span class="sec">{{ label(q.section) }}</span>
        @for (r of q.rules; track r) { <button type="button" class="rule" (click)="look.emit(r)" [title]="'Buscar ' + r">{{ r }}</button> }
        <span class="team">Equipo {{ q.team }}</span>
      </header>
      <h3 class="title">{{ q.title }}</h3>
      <p class="body">{{ q.body }}</p>

      @if (q.status !== 'pending' && q.answer) {
        <div class="answer">
          <p class="answer__k">
            {{ q.status === 'declined' ? 'Sin respuesta oficial' : 'Respuesta oficial' }}
            @if (q.answered_at) { <span>· {{ fmt(q.answered_at) }}</span> }
          </p>
          <p class="answer__t">{{ q.answer }}</p>
          @if (q.duplicate_of) { <button type="button" class="dup" (click)="look.emit('Q' + q.duplicate_of)">Ver Q{{ q.duplicate_of }} →</button> }
          @if (q.answer_rules.length) {
            <p class="cites">Reglas citadas:
              @for (r of q.answer_rules; track r) { <button type="button" class="rule" (click)="look.emit(r)">{{ r }}</button> }
            </p>
          }
        </div>
      } @else if (q.status === 'pending') {
        <p class="waiting">El Game Design Team está revisando esta pregunta.</p>
      }
    </article>
  `,
  styles: [`
    :host { display: block; }
    .card { padding: clamp(1.2rem, 2.2vw, 1.7rem); border-radius: 12px; background: #fff; border: 1px solid color-mix(in srgb, #111921 11%, transparent); }
    .compact { padding: 1rem 1.1rem; }
    .meta { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .6rem; }
    .num { padding: .35rem .55rem; border-radius: 4px; background: #111921; color: #FFFBFE; font: 700 .82rem/1 var(--tc-font-title); }
    .num--wait { background: color-mix(in srgb, #F8D718 40%, #fff); color: #6b5600; font-family: var(--tc-font-body); font-weight: 600; }
    .sec { font: 600 .8rem/1 var(--tc-font-body); color: #007886; }
    .rule { padding: .3rem .5rem; border-radius: 4px; border: 1px solid color-mix(in srgb, #00A6B8 35%, transparent); background: color-mix(in srgb, #00A6B8 7%, #fff); color: #005f6a; font: 600 .76rem/1 var(--tc-font-body); cursor: pointer; }
    .rule:hover { background: #00A6B8; color: #FFFBFE; }
    .team { margin-left: auto; font: 500 .8rem/1 var(--tc-font-body); color: color-mix(in srgb, #111921 55%, transparent); }
    .title { margin: .9rem 0 .4rem; font: 700 clamp(1.1rem, 1rem + .4vw, 1.3rem)/1.25 var(--tc-font-title); color: #111921; }
    .compact .title { font-size: 1.02rem; margin-top: .7rem; }
    .body { margin: 0; font: 400 1rem/1.6 var(--tc-font-body); color: color-mix(in srgb, #111921 78%, transparent); white-space: pre-line; }
    .compact .body { font-size: .92rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .answer { margin-top: 1.1rem; padding: 1rem 1.1rem; border-left: 3px solid #00A6B8; border-radius: 0 8px 8px 0; background: color-mix(in srgb, #00A6B8 6%, #fff); }
    .is-declined .answer { border-left-color: color-mix(in srgb, #111921 40%, transparent); background: color-mix(in srgb, #111921 4%, #fff); }
    .answer__k { margin: 0 0 .5rem; font: 700 .78rem/1 var(--tc-font-body); text-transform: uppercase; letter-spacing: .08em; color: #007886; }
    .is-declined .answer__k { color: color-mix(in srgb, #111921 60%, transparent); }
    .answer__k span { font-weight: 500; text-transform: none; letter-spacing: 0; color: color-mix(in srgb, #111921 55%, transparent); }
    .answer__t { margin: 0; font: 400 1rem/1.6 var(--tc-font-body); color: #111921; white-space: pre-line; }
    .dup { margin-top: .6rem; padding: 0; border: 0; background: none; color: #007886; font: 600 .9rem/1 var(--tc-font-body); cursor: pointer; }
    .cites { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin: .8rem 0 0; font: 500 .82rem/1 var(--tc-font-body); color: color-mix(in srgb, #111921 60%, transparent); }
    .waiting { margin: .9rem 0 0; font: 500 .9rem/1.4 var(--tc-font-body); color: #6b5600; }
    button:focus-visible { outline: 2px solid #00CFE6; outline-offset: 2px; }
  `],
})
export class QaCard {
  readonly item = input.required<Question>();
  readonly compact = input(false);
  readonly look = output<string>();
  protected label = sectionLabel;
  protected fmt(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' })
      .format(new Date(iso)).replace('.', '');
  }
}
