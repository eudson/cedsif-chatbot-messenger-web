import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/api.models';

/**
 * Serviço de autenticação - integração com Keycloak.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  // Estado do utilizador autenticado
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);

  // Sinais públicos
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => {
    const user = this._user();
    return user?.roles?.some(r => r === 'ADMIN' || r === 'SUPER_ADMIN') ?? false;
  });

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Obtém o token JWT actual.
   */
  getToken(): string | null {
    return this._token();
  }

  /**
   * Define o token e utilizador após login.
   */
  setAuth(token: string, user: User): void {
    this._token.set(token);
    this._user.set(user);

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  /**
   * Faz logout.
   */
  logout(): void {
    this._token.set(null);
    this._user.set(null);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    this.router.navigate(['/login']);
  }

  /**
   * Verifica se o utilizador tem um role específico.
   */
  hasRole(role: string): boolean {
    const user = this._user();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Carrega autenticação do localStorage.
   */
  private loadFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._token.set(token);
        this._user.set(user);
      } catch {
        this.logout();
      }
    }
  }

  /**
   * Verifica se o token está expirado.
   */
  isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() > exp;
    } catch {
      return true;
    }
  }
}
