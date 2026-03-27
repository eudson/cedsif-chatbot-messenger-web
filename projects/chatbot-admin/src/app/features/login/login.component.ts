import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <img src="logo.gif" alt="e-SISTAFE" class="logo" />
            <h1>e-SISTAFE Chatbot</h1>
            <p class="subtitle">Consola de Administração</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="login()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Utilizador</mat-label>
              <input matInput [(ngModel)]="username" name="username" required />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Palavra-passe</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required />
            </mat-form-field>

            @if (error()) {
              <p class="error-message">{{ error() }}</p>
            }

            <button mat-raised-button color="primary" type="submit"
                    [disabled]="loading()" class="full-width">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Entrar
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer>
          <p class="footer-text">CEDSIF - Centro de Desenvolvimento de Sistemas de Informação Financeira</p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
    }

    .login-card {
      width: 400px;
      padding: 24px;

      mat-card-header {
        justify-content: center;
        margin-bottom: 24px;
      }

      .logo {
        height: 60px;
        display: block;
        margin: 0 auto 16px;
      }

      h1 {
        font-size: 22px;
        text-align: center;
        margin: 0 0 8px 0;
        color: #1976d2;
        font-weight: 600;
      }

      .subtitle {
        display: block;
        text-align: center;
        font-size: 13px;
        color: #666;
        margin: 0;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .error-message {
      color: #f44336;
      text-align: center;
      margin-bottom: 16px;
    }

    .footer-text {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 16px;
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  login(): void {
    if (!this.username || !this.password) {
      this.error.set('Por favor, preencha todos os campos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Simulação de login - em produção, chamar API Keycloak
    setTimeout(() => {
      // Mock - aceitar qualquer login para demo
      const mockUser = {
        id: 1,
        keycloakId: 'demo-user',
        username: this.username,
        email: `${this.username}@cedsif.gov.mz`,
        fullName: this.username.charAt(0).toUpperCase() + this.username.slice(1),
        roles: ['ADMIN', 'USER']
      };

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJuYW1lIjoiQWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.mock';

      this.authService.setAuth(mockToken, mockUser);
      this.router.navigate(['/dashboard']);
      this.loading.set(false);
    }, 1000);
  }
}
