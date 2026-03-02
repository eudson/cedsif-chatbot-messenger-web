import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { ConversationDetailDialogComponent } from './conversation-detail-dialog.component';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h1>Conversas</h1>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Módulo</mat-label>
          <mat-select [(ngModel)]="selectedModule" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="DESPESA">Despesa</mat-option>
            <mat-option value="RECEITA">Receita</mat-option>
            <mat-option value="CUT">CUT</mat-option>
            <mat-option value="TRIBUTACAO">Tributação</mat-option>
            <mat-option value="SUPORTE">Suporte</mat-option>
            <mat-option value="DEV">Desenvolvimento</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="escalatedFilter" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option [value]="false">Normais</mat-option>
            <mat-option [value]="true">Escalados</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Satisfação</mat-label>
          <mat-select [(ngModel)]="satisfactionFilter" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="low">Baixa (< 60%)</mat-option>
            <mat-option value="medium">Média (60-80%)</mat-option>
            <mat-option value="high">Alta (> 80%)</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    } @else {
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="conversations()" class="full-width">
            <ng-container matColumnDef="session">
              <th mat-header-cell *matHeaderCellDef>Sessão</th>
              <td mat-cell *matCellDef="let row">
                <code class="session-id">{{ row.sessionId.substring(0, 8) }}</code>
              </td>
            </ng-container>

            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>Utilizador</th>
              <td mat-cell *matCellDef="let row">{{ row.username }}</td>
            </ng-container>

            <ng-container matColumnDef="module">
              <th mat-header-cell *matHeaderCellDef>Módulo</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip>{{ row.module }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="messages">
              <th mat-header-cell *matHeaderCellDef>Mensagens</th>
              <td mat-cell *matCellDef="let row">{{ row.messageCount }}</td>
            </ng-container>

            <ng-container matColumnDef="satisfaction">
              <th mat-header-cell *matHeaderCellDef>Satisfação</th>
              <td mat-cell *matCellDef="let row">
                @if (row.satisfaction) {
                  <span [class]="getSatisfactionClass(row.satisfaction)">
                    {{ (row.satisfaction * 100) | number:'1.0-0' }}%
                  </span>
                } @else {
                  <span class="text-muted">N/A</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                @if (row.escalated) {
                  <mat-chip color="warn">Escalado</mat-chip>
                } @else {
                  <mat-chip color="primary">Normal</mat-chip>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let row">
                {{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="viewConversation(row.id)">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"></tr>
          </table>

          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize()"
            [pageIndex]="currentPage()"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .filters {
        display: flex;
        gap: 16px;

        mat-form-field {
          width: 200px;
        }
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .session-id {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 2px 6px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .satisfaction-high { color: #4caf50; font-weight: 500; }
    .satisfaction-medium { color: #ff9800; font-weight: 500; }
    .satisfaction-low { color: #f44336; font-weight: 500; }

    .clickable-row {
      cursor: pointer;

      &:hover {
        background: #f5f5f5;
      }
    }
  `]
})
export class ConversationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  conversations = signal<any[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(20);
  currentPage = signal(0);

  selectedModule: string | null = null;
  escalatedFilter: boolean | null = null;
  satisfactionFilter: 'low' | 'medium' | 'high' | null = null;

  // Cache para filtro de satisfação (quando ativo, carrega todos os dados)
  private allConversations: any[] = [];
  private filteredConversations: any[] = [];
  private lastFilterState: string = '';

  displayedColumns = ['session', 'user', 'module', 'messages', 'satisfaction', 'status', 'date', 'actions'];

  ngOnInit() {
    this.loadConversations();
  }

  /**
   * Chamado quando qualquer filtro muda - reseta para primeira página
   */
  onFilterChange() {
    this.currentPage.set(0);
    // Limpar cache para forçar recarga
    this.filteredConversations = [];
    this.lastFilterState = '';
    this.loadConversations();
  }

  loadConversations() {
    this.loading.set(true);

    // Se houver filtro de satisfação, buscar todos os dados para filtrar no frontend
    if (this.satisfactionFilter) {
      this.loadAllAndFilter();
    } else {
      this.loadPaginated();
    }
  }

  /**
   * Carrega dados paginados do backend (sem filtro de satisfação)
   */
  private loadPaginated() {
    this.api.getConversations(
      this.currentPage(),
      this.pageSize(),
      this.selectedModule as any,
      this.escalatedFilter ?? undefined
    ).subscribe({
      next: (page) => {
        console.log('📊 Página recebida:', {
          content: page.content.length,
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          number: page.number,
          size: page.size
        });
        this.conversations.set(page.content);
        this.totalElements.set(page.totalElements || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar conversas:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Carrega todos os dados e filtra no frontend (quando filtro de satisfação está ativo)
   */
  private loadAllAndFilter() {
    const filterState = `${this.selectedModule}-${this.escalatedFilter}-${this.satisfactionFilter}`;

    // Se os filtros não mudaram e já temos dados em cache, apenas repaginar
    if (filterState === this.lastFilterState && this.filteredConversations.length > 0) {
      this.applyFrontendPagination();
      this.loading.set(false);
      return;
    }

    // Buscar todos os registros (máximo 1000)
    this.api.getConversations(
      0,
      1000,
      this.selectedModule as any,
      this.escalatedFilter ?? undefined
    ).subscribe({
      next: (page) => {
        // Guardar todos os dados
        this.allConversations = page.content;
        this.lastFilterState = filterState;

        // Aplicar filtro de satisfação
        this.filteredConversations = this.allConversations.filter(conv => {
          if (!conv.satisfaction) return false;
          switch (this.satisfactionFilter) {
            case 'low': return conv.satisfaction < 0.6;
            case 'medium': return conv.satisfaction >= 0.6 && conv.satisfaction < 0.8;
            case 'high': return conv.satisfaction >= 0.8;
            default: return true;
          }
        });

        this.applyFrontendPagination();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar conversas:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Aplica paginação nos dados já filtrados (frontend)
   */
  private applyFrontendPagination() {
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    const paginatedData = this.filteredConversations.slice(startIndex, endIndex);

    this.conversations.set(paginatedData);
    this.totalElements.set(this.filteredConversations.length);
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadConversations();
  }

  getSatisfactionClass(score: number): string {
    if (score >= 0.8) return 'satisfaction-high';
    if (score >= 0.6) return 'satisfaction-medium';
    return 'satisfaction-low';
  }

  viewConversation(id: number) {
    this.api.getConversation(id).subscribe({
      next: (conversation) => {
        this.dialog.open(ConversationDetailDialogComponent, {
          width: '900px',
          maxHeight: '90vh',
          data: conversation
        });
      },
      error: (err) => {
        console.error('Erro ao carregar conversa:', err);
      }
    });
  }
}
