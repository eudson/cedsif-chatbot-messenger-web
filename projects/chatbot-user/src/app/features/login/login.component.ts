import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="logo-section">
          <img src="logo.gif" alt="República de Moçambique" class="logo" />
          <h1>e-SISTAFE Chatbot</h1>
          <p class="subtitle">Sistema de Assistência Inteligente</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Utilizador</mat-label>
            <input
              matInput
              [(ngModel)]="username"
              name="username"
              required
              autocomplete="username"
              [disabled]="loading()">
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Palavra-passe</mat-label>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
              [disabled]="loading()">
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword = !hidePassword"
              [disabled]="loading()">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (errorMessage()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="full-width login-button"
            [disabled]="!loginForm.form.valid || loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>A autenticar...</span>
            } @else {
              <span>Entrar</span>
            }
          </button>

          @if (!isProduction) {
            <div class="dev-hint">
              <mat-icon>info</mat-icon>
              <span>Ambiente de desenvolvimento: qualquer utilizador/senha é aceite</span>
            </div>
          }
        </form>

        <div class="footer">
          <p>© 2024 CEDSIF - Centro de Desenvolvimento de Sistemas de Informação Financeira</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
    }

    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 48px 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      background: white;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      height: 80px;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #1976d2;
      letter-spacing: -0.5px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 15px;
      font-weight: 400;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field {
      font-size: 16px;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: #f5f5f5;
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 12px;
      color: #666;
    }

    ::ng-deep .mat-mdc-form-field-icon-suffix {
      padding-left: 12px;
    }

    ::ng-deep .mdc-text-field--filled {
      background-color: #f5f5f5 !important;
    }

    ::ng-deep .mat-mdc-input-element {
      color: #333;
      font-size: 16px;
    }

    ::ng-deep .mat-mdc-form-field-label {
      color: #666;
      font-size: 16px;
    }

    .login-button {
      height: 52px;
      font-size: 17px;
      font-weight: 500;
      margin-top: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;

      span {
        color: white;
        font-weight: 500;
      }
    }

    ::ng-deep .login-button mat-spinner {
      display: inline-block;
      margin-right: 12px;
    }

    ::ng-deep .login-button mat-spinner circle {
      stroke: white;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      border-left: 4px solid #c62828;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .dev-hint {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border-left: 4px solid #1976d2;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      span {
        line-height: 1.4;
      }
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .footer p {
      margin: 0;
      color: #999;
      font-size: 12px;
      line-height: 1.5;
      font-weight: 400;
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  hidePassword = true;
  loading = signal(false);
  errorMessage = signal('');
  isProduction = environment.production;

  ngOnInit(): void {
    // Se já estiver autenticado, redirecionar
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    // Em desenvolvimento, aceitar qualquer login
    if (!environment.production) {
      setTimeout(() => {
        const mockUser = {
          id: 1,
          keycloakId: 'demo-user',
          username: this.username,
          email: `${this.username}@cedsif.gov.mz`,
          fullName: this.username.charAt(0).toUpperCase() + this.username.slice(1),
          roles: ['USER']
        };

        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJuYW1lIjoiVXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxODAwMDAwMDAwfQ.mock';

        localStorage.setItem('chatbot_token', mockToken);
        localStorage.setItem('chatbot_user', JSON.stringify(mockUser));
        this.auth.user.set(mockUser);
        this.auth.isAuthenticated.set(true);

        this.router.navigate(['/']);
        this.loading.set(false);
      }, 800);
      return;
    }

    // Em produção, usar API real
    this.auth.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set(response.message || 'Erro ao fazer login');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage.set('Utilizador ou palavra-passe incorrectos');
        this.loading.set(false);
      }
    });
  }
}
