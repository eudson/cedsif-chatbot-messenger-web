import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'chatbot_token';
  private readonly USER_KEY = 'chatbot_user';

  user = signal<User | null>(null);
  isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.user.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    const request: LoginRequest = { username, password };

    return this.http.post<ApiResponse<LoginResponse>>(
      `${environment.apiUrl}/v1/auth/login`,
      request
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuth(response.data);
        }
      })
    );
  }

  private setAuth(loginResponse: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, loginResponse.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(loginResponse.user));

    this.user.set(loginResponse.user);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.user.set(null);
    this.isAuthenticated.set(false);

    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.user();
  }
}
