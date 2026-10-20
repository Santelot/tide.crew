import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-account',
  template: `
    <section class="page">
      <h1 class="page__title">Mi cuenta</h1>
      <dl class="acct">
        <dt>Email</dt><dd>{{ auth.user()?.email }}</dd>
        <dt>Rol</dt><dd>{{ auth.role() ?? '—' }}</dd>
      </dl>
      <button class="btn" type="button" (click)="signOut()">Salir</button>
    </section>
  `,
  styles: [`
    .acct { display: grid; grid-template-columns: auto 1fr; gap: .4rem 1.5rem; margin: 1.5rem 0; }
    .acct dt { color: var(--tc-crest); }
    .btn { padding: .7rem 1.4rem; border-radius: var(--tc-radius-pill); background: transparent; color: var(--tc-foam); cursor: pointer;
      border: 1px solid var(--tc-slate); }
    .btn:hover { border-color: var(--tc-pacific); }
  `],
})
export class Account {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  async signOut() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
