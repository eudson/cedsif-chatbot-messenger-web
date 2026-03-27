import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface IncidentConversationData {
  incident: {
    id: number;
    glpiTicketId: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    resolvedAt?: string;
  };
  conversation?: {
    id: number;
    sessionId: string;
    module: string;
    messages: Array<{
      id: number;
      type: string;
      content: string;
      timestamp: string;
      ragScore?: number;
    }>;
  };
}

@Component({
  selector: 'app-incident-conversation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>support_agent</mat-icon>
      Detalhes do Incidente #{{ data.incident.glpiTicketId }}
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </h2>

    <mat-dialog-content>
      <!-- Incident Info -->
      <div class="incident-info">
        <h3>Informações do Ticket</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Título</label>
            <span>{{ data.incident.title }}</span>
          </div>
          <div class="info-item">
            <label>Status</label>
            <mat-chip [color]="getStatusColor(data.incident.status)">
              {{ data.incident.status }}
            </mat-chip>
          </div>
          <div class="info-item">
            <label>Prioridade</label>
            <mat-chip [class]="'priority-' + data.incident.priority">
              {{ data.incident.priority }}
            </mat-chip>
          </div>
          <div class="info-item">
            <label>Criado em</label>
            <span>{{ data.incident.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          @if (data.incident.resolvedAt) {
            <div class="info-item">
              <label>Resolvido em</label>
              <span>{{ data.incident.resolvedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          }
        </div>

        @if (data.incident.description) {
          <div class="description-box">
            <label>Descrição</label>
            <p>{{ data.incident.description }}</p>
          </div>
        }
      </div>

      <mat-divider></mat-divider>

      <!-- Conversation -->
      <div class="conversation-section">
        <h3>
          <mat-icon>chat</mat-icon>
          Conversa Associada
        </h3>

        @if (data.conversation) {
          <div class="conversation-meta">
            <span><strong>Sessão:</strong> {{ data.conversation.sessionId | slice:0:8 }}...</span>
            <span><strong>Módulo:</strong> {{ data.conversation.module }}</span>
            <span><strong>Mensagens:</strong> {{ data.conversation.messages.length }}</span>
          </div>

          <div class="messages-container">
            @for (msg of data.conversation.messages; track msg.id) {
              <div class="message" [class.user]="msg.type === 'USER'" [class.assistant]="msg.type === 'ASSISTANT'">
                <div class="message-header">
                  <mat-icon>{{ msg.type === 'USER' ? 'person' : 'smart_toy' }}</mat-icon>
                  <strong>{{ msg.type === 'USER' ? 'Utilizador' : 'Assistente' }}</strong>
                  <span class="timestamp">{{ msg.timestamp | date:'dd/MM HH:mm' }}</span>
                  @if (msg.ragScore) {
                    <span class="rag-score" [class.low]="msg.ragScore < 0.5">
                      RAG: {{ (msg.ragScore * 100) | number:'1.0-0' }}%
                    </span>
                  }
                </div>
                <div class="message-content">{{ msg.content }}</div>
              </div>
            }
          </div>
        } @else {
          <div class="no-conversation">
            <mat-icon>info</mat-icon>
            <p>Nenhuma conversa associada a este incidente.</p>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
      @if (data.conversation) {
        <button mat-raised-button color="primary" (click)="exportConversation()">
          <mat-icon>download</mat-icon>
          Exportar
        </button>
      }
      <a mat-raised-button color="accent"
         [href]="'http://localhost:9080/front/ticket.form.php?id=' + data.incident.glpiTicketId"
         target="_blank">
        <mat-icon>open_in_new</mat-icon>
        Abrir no GLPI
      </a>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      mat-icon { color: #1976d2; }
    }
    .close-btn { margin-left: auto; }

    mat-dialog-content {
      max-height: 70vh;
      padding: 24px;
      min-width: 600px;
    }

    .incident-info {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      label {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
        text-transform: uppercase;
      }

      span {
        font-size: 14px;
      }
    }

    .description-box {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;

      label {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
        white-space: pre-wrap;
      }
    }

    mat-divider {
      margin: 24px 0;
    }

    .conversation-section {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .conversation-meta {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
    }

    .messages-container {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 8px;
    }

    .message {
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .message.user {
      background: #e3f2fd;
      border-color: #2196f3;
    }

    .message.assistant {
      background: #f5f5f5;
      border-color: #9e9e9e;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .timestamp {
      color: #666;
      font-size: 12px;
      margin-left: auto;
    }

    .rag-score {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e8f5e9;
      color: #2e7d32;

      &.low {
        background: #ffebee;
        color: #c62828;
      }
    }

    .message-content {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.5;
    }

    .no-conversation {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      background: #fff3e0;
      border-radius: 8px;
      color: #e65100;

      p { margin: 0; }
    }

    .priority-BAIXA { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .priority-MEDIA { background-color: #fff3e0 !important; color: #e65100 !important; }
    .priority-ALTA { background-color: #ffebee !important; color: #c62828 !important; }
    .priority-MUITO_ALTA { background-color: #f3e5f5 !important; color: #7b1fa2 !important; }
  `]
})
export class IncidentConversationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<IncidentConversationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IncidentConversationData
  ) {}

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'ABERTO':
      case 'EM_ANDAMENTO':
        return 'primary';
      case 'RESOLVIDO':
        return 'accent';
      case 'FECHADO':
        return 'warn';
      default:
        return 'primary';
    }
  }

  exportConversation(): void {
    if (!this.data.conversation) return;

    const lines = [
      `INCIDENTE GLPI #${this.data.incident.glpiTicketId}`,
      '='.repeat(50),
      '',
      `Título: ${this.data.incident.title}`,
      `Status: ${this.data.incident.status}`,
      `Prioridade: ${this.data.incident.priority}`,
      `Criado: ${this.data.incident.createdAt}`,
      '',
      'CONVERSA ASSOCIADA',
      '-'.repeat(50),
      `Sessão: ${this.data.conversation.sessionId}`,
      `Módulo: ${this.data.conversation.module}`,
      '',
      ...this.data.conversation.messages.map((msg, idx) =>
        `[${idx + 1}] ${msg.type} (${msg.timestamp})\n${msg.content}\n`
      )
    ];

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidente-${this.data.incident.glpiTicketId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
