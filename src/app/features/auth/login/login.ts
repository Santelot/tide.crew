import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth__card">
      <div class="auth__crest">Ride the Tide</div>
      <h1>{{ mode() === 'signin' ? t('login.signin') : t('login.signup') }}</h1>

      @if (mode() === 'signup') {
        <label>Nombre
          <input type="text" [value]="fullName()" (input)="fullName.set($any($event.target).value)" autocomplete="name" />
        </label>
      }
      <label>Email
        <input type="email" [value]="email()" (input)="email.set($any($event.target).value)" autocomplete="email" />
      </label>
      <label>Contraseña
        <input type="password" [value]="password()" (input)="password.set($any($event.target).value)" autocomplete="current-password" />
      </label>

      @if (error()) { <p class="auth__error">{{ error() }}</p> }

      <button class="auth__submit" type="button" [disabled]="busy()" (click)="submit()">
        {{ busy() ? '…' : (mode() === 'signin' ? t('login.signin') : t('login.signup')) }}
      </button>
      <button class="auth__toggle" type="button" (click)="toggleMode()">
        {{ mode() === 'signin' ? t('login.toggleToSignup') : t('login.toggleToSignin') }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: grid; place-items: center; min-height: 100vh; padding: 1.5rem; }
    .auth__card { width: min(24rem, 100%); display: flex; flex-direction: column; gap: .6rem; padding: 2rem;
      border: 1px solid color-mix(in srgb, var(--tc-foam) 12%, transparent); border-radius: var(--tc-radius-card);
      background: color-mix(in srgb, var(--tc-undertow) 18%, var(--tc-night)); }
    .auth__crest { font-family: var(--tc-font-display); color: var(--tc-crest); letter-spacing: .04em; }
    h1 { font-family: var(--tc-font-title); margin: 0 0 .5rem; font-size: 1.5rem; }
    label { display: grid; gap: .3rem; font-size: .82rem; color: color-mix(in srgb, var(--tc-foam) 70%, transparent); }
    input { padding: .6rem .7rem; border-radius: var(--tc-radius-sharp); background: var(--tc-night); color: var(--tc-foam); font: inherit;
      border: 1px solid color-mix(in srgb, var(--tc-foam) 18%, transparent); }
    input:focus { outline: 2px solid var(--tc-pacific); border-color: transparent; }
    .auth__error { color: var(--tc-coral); font-size: .85rem; margin: .2rem 0 0; }
    .auth__submit { margin-top: .6rem; padding: .8rem; border: none; border-radius: var(--tc-radius-pill);
      background: var(--tc-pacific); color: var(--tc-night); font-weight: 600; cursor: pointer; }
    .auth__submit:hover:not(:disabled) { background: var(--tc-crest); }
    .auth__submit:disabled { opacity: .6; cursor: default; }
    .auth__toggle { background: none; border: none; cursor: pointer; font: inherit; font-size: .85rem; margin-top: .2rem;
      color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .auth__toggle:hover { color: var(--tc-crest); }
  `],
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  protected readonly mode = signal<'signin' | 'signup'>('signin');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly fullName = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  toggleMode() {
    this.error.set(null);
    this.mode.set(this.mode() === 'signin' ? 'signup' : 'signin');
  }

  async submit() {
    this.error.set(null);
    this.busy.set(true);
    try {
      const { error } =
        this.mode() === 'signin'
          ? await this.auth.signIn(this.email(), this.password())
          : await this.auth.signUp(this.email(), this.password(), this.fullName());
      if (error) throw error;
      await this.auth.loadProfile();
      this.router.navigateByUrl(this.auth.isAdmin() ? '/admin' : '/');
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Algo salió mal.');
    } finally {
      this.busy.set(false);
    }
  }
}
