import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { IncidentConversationDialogComponent } from './incident-conversation-dialog.component';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatTableModule,
    MatPaginatorModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule
  ],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Incidentes GLPI</h1>
        <span class="subtitle">Tickets escalados automaticamente pelo chatbot</span>
      </div>
      <div class="header-right">
        <!-- Filtros compactos -->
        <div class="filters-compact">
          <mat-form-field appearance="outline">
            <mat-label>Pesquisar</mat-label>
            <input matInput [(ngModel)]="titleFilter" (keyup.enter)="onFilterChange()" placeholder="Título">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="ABERTO">Aberto</mat-option>
              <mat-option value="EM_ANDAMENTO">Em Andamento</mat-option>
              <mat-option value="RESOLVIDO">Resolvido</mat-option>
              <mat-option value="FECHADO">Fechado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nº Ticket</mat-label>
            <input matInput type="number" [(ngModel)]="ticketIdFilter" (keyup.enter)="onFilterChange()">
          </mat-form-field>

          <button mat-icon-button (click)="clearFilters()" matTooltip="Limpar filtros"
                  *ngIf="statusFilter || ticketIdFilter || titleFilter">
            <mat-icon>clear</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <mat-card class="stat-card">
        <mat-icon>pending_actions</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats().pending || 0 }}</span>
          <span class="stat-label">Pendentes</span>
        </div>
      </mat-card>
      <mat-card class="stat-card">
        <mat-icon>check_circle</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats().resolved || 0 }}</span>
          <span class="stat-label">Resolvidos</span>
        </div>
      </mat-card>
      <mat-card class="stat-card">
        <mat-icon>timer</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ stats().avgResolutionTime || '-' }}</span>
          <span class="stat-label">Tempo Médio</span>
        </div>
      </mat-card>
    </div>

    <mat-card>
      @if (loading()) {
        <div class="loading"><mat-spinner></mat-spinner></div>
      } @else if (incidents().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>Nenhum incidente encontrado</p>
        </div>
      } @else {
        <table mat-table [dataSource]="incidents()" class="full-width">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>Ticket</th>
            <td mat-cell *matCellDef="let row">
              <a [href]="'http://localhost:9080/front/ticket.form.php?id=' + row.glpiTicketId"
                 target="_blank" class="ticket-link">
                #{{ row.glpiTicketId }}
              </a>
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let row">
              <span class="title-text" [matTooltip]="row.title">{{ row.title | slice:0:50 }}{{ row.title?.length > 50 ? '...' : '' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="'status-' + row.status" size="small">
                {{ formatStatus(row.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Prioridade</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="'priority-' + row.priority" size="small">
                {{ formatPriority(row.priority) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Criado</th>
            <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acções</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary"
                      matTooltip="Ver Conversa"
                      (click)="viewConversation(row); $event.stopPropagation()">
                <mat-icon>chat</mat-icon>
              </button>
              <a mat-icon-button color="accent"
                 matTooltip="Abrir no GLPI"
                 [href]="'http://localhost:9080/front/ticket.form.php?id=' + row.glpiTicketId"
                 target="_blank"
                 (click)="$event.stopPropagation()">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" class="clickable-row" (click)="viewConversation(row)"></tr>
        </table>
        <mat-paginator
          [length]="totalElements()"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)">
        </mat-paginator>
      }
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 24px;

      .header-left {
        h1 {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 500;
        }

        .subtitle {
          color: rgba(0, 0, 0, 0.54);
          font-size: 14px;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .filters-compact {
        display: flex;
        gap: 12px;
        align-items: center;

        mat-form-field {
          width: 140px;

          &:first-child {
            width: 200px;
          }
        }
      }
    }

    .stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #1976d2;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 500;
      }

      .stat-label {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.54);
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.54);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }
    }

    .full-width {
      width: 100%;
    }

    .ticket-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .title-text {
      max-width: 300px;
      display: inline-block;
    }

    .clickable-row {
      cursor: pointer;

      &:hover {
        background: #f5f5f5;
      }
    }

    /* Status colors */
    .status-ABERTO { background-color: #e3f2fd !important; color: #1565c0 !important; }
    .status-EM_ANDAMENTO { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-RESOLVIDO { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-FECHADO { background-color: #f5f5f5 !important; color: #616161 !important; }

    /* Priority colors */
    .priority-BAIXA { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .priority-MEDIA { background-color: #fff3e0 !important; color: #e65100 !important; }
    .priority-ALTA { background-color: #ffebee !important; color: #c62828 !important; }
    .priority-MUITO_ALTA { background-color: #f3e5f5 !important; color: #7b1fa2 !important; }
  `]
})
export class IncidentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  incidents = signal<any[]>([]);
  stats = signal<any>({});
  loading = signal(true);
  totalElements = signal(0);
  currentPage = 0;
  pageSize = 20;

  // Filters
  statusFilter: string | null = null;
  ticketIdFilter: number | null = null;
  titleFilter: string = '';

  cols = ['id', 'title', 'status', 'priority', 'created', 'actions'];

  ngOnInit() {
    this.loadStats();
    this.loadIncidents();
  }

  loadStats() {
    this.api.getIncidentStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
  }

  loadIncidents() {
    this.loading.set(true);
    this.api.getIncidentsFiltered(
      this.currentPage,
      this.pageSize,
      this.statusFilter || undefined,
      this.titleFilter || undefined,
      this.ticketIdFilter || undefined
    ).subscribe({
      next: (p) => {
        this.incidents.set(p.content);
        this.totalElements.set(p.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadIncidents();
  }

  clearFilters() {
    this.statusFilter = null;
    this.ticketIdFilter = null;
    this.titleFilter = '';
    this.currentPage = 0;
    this.loadIncidents();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadIncidents();
  }

  viewConversation(incident: any) {
    this.api.getIncidentWithConversation(incident.id).subscribe({
      next: (data) => {
        this.dialog.open(IncidentConversationDialogComponent, {
          width: '800px',
          maxHeight: '90vh',
          data: {
            incident: data.incident || incident,
            conversation: data.conversation
          }
        });
      },
      error: () => {
        this.dialog.open(IncidentConversationDialogComponent, {
          width: '800px',
          maxHeight: '90vh',
          data: {
            incident: incident,
            conversation: null
          }
        });
      }
    });
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ABERTO': 'Aberto',
      'EM_ANDAMENTO': 'Em Andamento',
      'RESOLVIDO': 'Resolvido',
      'FECHADO': 'Fechado'
    };
    return statusMap[status] || status;
  }

  formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta',
      'MUITO_ALTA': 'Muito Alta'
    };
    return priorityMap[priority] || priority;
  }
}
