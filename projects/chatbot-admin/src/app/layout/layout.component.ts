import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <!-- Sidebar -->
      <mat-sidenav #sidenav mode="side" [opened]="sidenavOpen()">
        <div class="sidenav-header">
          <img src="assets/logo-cedsif.png" alt="CEDSIF" class="logo" />
          <h2>Chatbot AI</h2>
        </div>

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content>
        <!-- Toolbar -->
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="toggleSidenav()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">Gestão de Mensagens</span>
          <span class="spacer"></span>

          <!-- User menu -->
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <strong>{{ auth.user()?.fullName }}</strong>
              <small>{{ auth.user()?.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- Page content -->
        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .layout-container {
      height: 100vh;
    }

    mat-sidenav {
      width: 260px;
      padding: 0;
    }

    .sidenav-header {
      padding: 24px 16px;
      text-align: center;
      border-bottom: 1px solid rgba(0,0,0,0.12);

      .logo {
        height: 48px;
        margin-bottom: 8px;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        color: #1976d2;
      }
    }

    mat-nav-list a.active {
      background: rgba(25, 118, 210, 0.12);
      color: #1976d2;
    }

    .toolbar-title {
      margin-left: 16px;
      font-size: 18px;
    }

    .spacer {
      flex: 1;
    }

    .main-content {
      padding: 24px;
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }

    .user-info {
      padding: 16px;
      display: flex;
      flex-direction: column;

      small {
        color: #666;
        margin-top: 4px;
      }
    }
  `]
})
export class LayoutComponent {
  readonly auth = inject(AuthService);

  sidenavOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Conversas', icon: 'chat', route: '/conversations' },
    { label: 'Base de Conhecimento', icon: 'library_books', route: '/knowledge-base' },
    { label: 'Incidentes', icon: 'report_problem', route: '/incidents' },
    { label: 'Configurações', icon: 'settings', route: '/settings' }
  ];

  toggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }
}
