import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  loading?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterModule
  ],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
      <span class="subtitle">Visão geral do sistema</span>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      @for (stat of stats(); track stat.title) {
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" [style.background-color]="stat.color + '20'">
              <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              @if (stat.loading) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-title">{{ stat.title }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <!-- Module Performance -->
    @if (moduleMetrics().length > 0) {
      <mat-card class="mt-3">
        <mat-card-header>
          <mat-card-title>Desempenho por Módulo</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="moduleMetrics()" class="full-width">
            <ng-container matColumnDef="module">
              <th mat-header-cell *matHeaderCellDef>Módulo</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ row.module }}</strong>
                <br>
                <small class="text-muted">{{ row.description }}</small>
              </td>
            </ng-container>

            <ng-container matColumnDef="conversations">
              <th mat-header-cell *matHeaderCellDef>Conversas</th>
              <td mat-cell *matCellDef="let row">{{ row.conversationCount }}</td>
            </ng-container>

            <ng-container matColumnDef="satisfaction">
              <th mat-header-cell *matHeaderCellDef>Satisfação</th>
              <td mat-cell *matCellDef="let row">
                <span [class]="getSatisfactionClass(row.satisfactionScore)">
                  {{ row.satisfactionScore | number:'1.1-1' }}%
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    }

    <!-- Recent Activity -->
    <div class="grid grid-cols-2 mt-3">
      <!-- Recent Conversations -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Conversas Recentes</mat-card-title>
          <button mat-icon-button routerLink="/conversations">
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (loadingConversations()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (recentConversations().length > 0) {
            <div class="conversation-list">
              @for (conv of recentConversations(); track conv.id) {
                <div class="conversation-item" (click)="viewConversation(conv.id)">
                  <div class="conv-header">
                    <strong>{{ conv.username }}</strong>
                    <span class="badge" [class.badge-warning]="conv.escalated">
                      {{ conv.module }}
                    </span>
                  </div>
                  <div class="conv-meta">
                    <span class="text-muted">{{ conv.messageCount }} mensagens</span>
                    <span class="text-muted">{{ formatDate(conv.lastActivity) }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted">Nenhuma conversa recente</p>
          }
        </mat-card-content>
      </mat-card>

      <!-- Pending Incidents -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Incidentes Pendentes</mat-card-title>
          <button mat-icon-button routerLink="/incidents">
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (loadingIncidents()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (pendingIncidents().length > 0) {
            <div class="incident-list">
              @for (incident of pendingIncidents(); track incident.id) {
                <div class="incident-item" (click)="viewIncident(incident.id)">
                  <div class="incident-header">
                    <strong>{{ incident.title }}</strong>
                    @if (incident.slaBreached) {
                      <mat-icon class="sla-warning" color="warn">warning</mat-icon>
                    }
                  </div>
                  <div class="incident-meta">
                    <span [class]="'priority-' + incident.priority">
                      {{ incident.priority }}
                    </span>
                    <span class="text-muted">{{ incident.category }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted">Nenhum incidente pendente</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .subtitle {
        color: rgba(0, 0, 0, 0.54);
        font-size: 14px;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px !important;
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      min-width: 80px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 500;
      line-height: 1.2;
    }

    .stat-title {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .conversation-list,
    .incident-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .conversation-item,
    .incident-item {
      padding: 12px;
      border-radius: 8px;
      background: #f5f5f5;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #e0e0e0;
      }
    }

    .conv-header,
    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .conv-meta,
    .incident-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 12px;
      background: #2196f3;
      color: white;
      font-size: 11px;
      font-weight: 500;

      &.badge-warning {
        background: #ff9800;
      }
    }

    .sla-warning {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .priority-BAIXA { color: #4caf50; }
    .priority-MEDIA { color: #ff9800; }
    .priority-ALTA { color: #f44336; }
    .priority-URGENTE { color: #d32f2f; font-weight: 500; }

    .satisfaction-high { color: #4caf50; font-weight: 500; }
    .satisfaction-medium { color: #ff9800; font-weight: 500; }
    .satisfaction-low { color: #f44336; font-weight: 500; }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  stats = signal<StatCard[]>([
    { title: 'Total Conversas', value: '0', icon: 'chat', color: '#3f51b5', loading: true },
    { title: 'Base Conhecimento', value: '0', icon: 'menu_book', color: '#4caf50', loading: true },
    { title: 'Incidentes Abertos', value: '0', icon: 'report_problem', color: '#ff9800', loading: true },
    { title: 'Taxa Escalação', value: '0%', icon: 'trending_up', color: '#9c27b0', loading: true }
  ]);

  moduleMetrics = signal<any[]>([]);
  recentConversations = signal<any[]>([]);
  pendingIncidents = signal<any[]>([]);

  loadingConversations = signal(true);
  loadingIncidents = signal(true);

  displayedColumns = ['module', 'conversations', 'satisfaction'];

  ngOnInit() {
    this.loadDashboard();
    this.loadRecentConversations();
    this.loadPendingIncidents();
  }

  private loadDashboard() {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.stats.set([
          {
            title: 'Total Conversas',
            value: data.general.totalConversations.toString(),
            icon: 'chat',
            color: '#3f51b5'
          },
          {
            title: 'Docs Indexados',
            value: this.calculateTotalDocs(data.modules).toString(),
            icon: 'menu_book',
            color: '#4caf50'
          },
          {
            title: 'Incidentes Abertos',
            value: data.general.openIncidents.toString(),
            icon: 'report_problem',
            color: '#ff9800'
          },
          {
            title: 'Taxa Escalação',
            value: data.general.escalationRate.toFixed(1) + '%',
            icon: 'trending_up',
            color: '#9c27b0'
          }
        ]);

        this.moduleMetrics.set(data.modules.map(m => ({
          ...m,
          satisfactionScore: m.satisfactionScore * 100
        })));
      },
      error: (err) => console.error('Erro ao carregar dashboard:', err)
    });
  }

  private loadRecentConversations() {
    this.api.getConversations(0, 5).subscribe({
      next: (page) => {
        this.recentConversations.set(page.content);
        this.loadingConversations.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar conversas:', err);
        this.loadingConversations.set(false);
      }
    });
  }

  private loadPendingIncidents() {
    this.api.getPendingIncidents(0, 5).subscribe({
      next: (page) => {
        this.pendingIncidents.set(page.content);
        this.loadingIncidents.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar incidentes:', err);
        this.loadingIncidents.set(false);
      }
    });
  }

  private calculateTotalDocs(modules: any[]): number {
    return modules.reduce((sum, m) => sum + (m.documentCount || 0), 0);
  }

  getSatisfactionClass(score: number): string {
    if (score >= 80) return 'satisfaction-high';
    if (score >= 60) return 'satisfaction-medium';
    return 'satisfaction-low';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return `${Math.floor(minutes / 1440)}d atrás`;
  }

  viewConversation(id: number) {
    this.router.navigate(['/conversations', id]);
  }

  viewIncident(id: number) {
    this.router.navigate(['/incidents', id]);
  }
}
