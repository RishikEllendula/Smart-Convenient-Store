import { Injectable, signal, computed } from '@angular/core';
import { ApiService, User } from './api.service';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

type Role = 'Owner' | 'Customer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(this.loadToken());

  user = computed(() => this._user());
  token = computed(() => this._token());
  isOwner = computed(() => this._user()?.role === 'Owner');
  isCustomer = computed(() => this._user()?.role === 'Customer');

  constructor(private api: ApiService) {}

  /* ---------- Storage helpers ---------- */
  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem('auth.user');
      return raw ? JSON.parse(raw) as User : null;
    } catch { return null; }
  }

  private loadToken(): string | null {
    try {
      return localStorage.getItem('auth.token');
    } catch { return null; }
  }

  private persist(u: User, t: string) {
    localStorage.setItem('auth.user', JSON.stringify(u));
    localStorage.setItem('auth.token', t);
    this._user.set(u);
    this._token.set(t);
  }

  /* ---------- API flows ---------- */
  register(payload: { name: string; email: string; password: string; role: Role }): Promise<{token:string; user: User}> {
    return firstValueFrom(
      this.api.register(payload).pipe(tap(({ token, user }) => this.persist(user, token)))
    );
  }

  login(payload: { email: string; password: string }): Promise<{token:string; user: User}> {
    return firstValueFrom(
      this.api.login(payload).pipe(tap(({ token, user }) => this.persist(user, token)))
    );
  }

  logout() {
    localStorage.removeItem('auth.user');
    localStorage.removeItem('auth.token');
    this._user.set(null);
    this._token.set(null);
    // Optional: clear any compare/browse cache
    sessionStorage.removeItem('lastCompare');
  }
}
