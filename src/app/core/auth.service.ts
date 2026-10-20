import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export type Role = 'customer' | 'admin';

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService).client;

  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly role = computed<Role | null>(() => this.profile()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isLoggedIn = computed(() => !!this.user());

  // Resolves once the first session check finishes. Guards await this so a
  // hard refresh on a protected URL waits for auth instead of bouncing to /login.
  private resolveReady!: () => void;
  readonly initialized = new Promise<void>((r) => (this.resolveReady = r));

  constructor() {
    // Initial session read. `.finally` guarantees `initialized` always resolves —
    // a guard must never hang, even if this rejects.
    this.sb.auth
      .getSession()
      .then(async ({ data }) => {
        this.session.set(data.session);
        if (data.session) await this.loadProfile();
      })
      .catch(() => {
        /* ignore — treat as logged out */
      })
      .finally(() => this.resolveReady());

    // IMPORTANT: this callback runs *inside* supabase-js's auth lock. Calling any
    // other Supabase method here (e.g. loadProfile -> from('profiles')) would wait
    // on the same lock and deadlock the whole client. So we only touch local state
    // synchronously and defer any Supabase call out of the lock with setTimeout(0).
    this.sb.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (session) {
        setTimeout(() => void this.loadProfile(), 0);
      } else {
        this.profile.set(null);
      }
    });
  }

  async loadProfile(): Promise<void> {
    const id = this.user()?.id;
    if (!id) return;
    const { data } = await this.sb
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', id)
      .single();
    this.profile.set((data as Profile) ?? null);
  }

  signIn(email: string, password: string) {
    return this.sb.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string, fullName?: string) {
    return this.sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? null } },
    });
  }

  signOut() {
    return this.sb.auth.signOut();
  }
}
