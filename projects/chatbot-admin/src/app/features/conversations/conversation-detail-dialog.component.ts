import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface ConversationDetailData {
  id: number;
  sessionId: string;
  username: string;
  email: string;
  module: string;
  escalated: boolean;
  satisfaction?: number;
  createdAt: string;
  messages: Array<{
    id: number;
    type: string;
    content: string;
    ragScore?: number;
    timestamp: string;
  }>;
}

@Component({
  selector: 'app-conversation-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>chat</mat-icon>
      Detalhes da Conversa
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </h2>

    <mat-dialog-content>
      <div class="conversation-info">
        <div class="info-row">
          <strong>Sessão:</strong>
          <code>{{ data.sessionId }}</code>
        </div>
        <div class="info-row">
          <strong>Utilizador:</strong>
          <span>{{ data.username }}</span>
        </div>
        <div class="info-row">
          <strong>Módulo:</strong>
          <mat-chip>{{ data.module }}</mat-chip>
        </div>
        <div class="info-row">
          <strong>Status:</strong>
          <mat-chip [color]="data.escalated ? 'warn' : 'primary'">
            {{ data.escalated ? 'Escalado' : 'Normal' }}
          </mat-chip>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="messages-container">
        <div class="message-count">
          {{ data.messages.length }} mensagens no total
        </div>

        <div *ngFor="let msg of data.messages"
             class="message"
             [class.user]="msg.type === 'USER'"
             [class.assistant]="msg.type === 'ASSISTANT'">
          <div class="message-header">
            <mat-icon>{{ msg.type === 'USER' ? 'person' : 'smart_toy' }}</mat-icon>
            <strong>{{ msg.type === 'USER' ? 'Utilizador' : 'Assistente' }}</strong>
            <span class="timestamp">{{ msg.timestamp | date:'dd/MM HH:mm' }}</span>
            <span *ngIf="msg.ragScore" class="rag-score">
              RAG: {{ (msg.ragScore * 100) | number:'1.0-0' }}%
            </span>
          </div>
          <div class="message-content">{{ msg.content }}</div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
      <button mat-raised-button color="primary" (click)="exportConversation()">
        <mat-icon>download</mat-icon>
        Exportar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    .close-btn { margin-left: auto; }
    mat-dialog-content { max-height: 70vh; padding: 24px; }
    .conversation-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .info-row { display: flex; align-items: center; gap: 8px; }
    .info-row strong { min-width: 100px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    .message-count { margin: 16px 0; font-weight: 500; color: #666; }
    .message { margin-bottom: 16px; padding: 12px; border-radius: 8px; border-left: 4px solid; }
    .message.user { background: #e3f2fd; border-color: #2196f3; }
    .message.assistant { background: #f5f5f5; border-color: #9e9e9e; }
    .message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .timestamp { color: #666; font-size: 12px; margin-left: auto; }
    .rag-score { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: white; }
    .message-content { white-space: pre-wrap; word-break: break-word; }
  `]
})
export class ConversationDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConversationDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConversationDetailData
  ) {}

  exportConversation(): void {
    const text = `CONVERSA E-SISTAFE\n${'='.repeat(50)}\n\n` +
      `Sessão: ${this.data.sessionId}\n` +
      `Utilizador: ${this.data.username}\n` +
      `Módulo: ${this.data.module}\n\n` +
      this.data.messages.map((msg, idx) =>
        `[${idx + 1}] ${msg.type} (${msg.timestamp})\n${msg.content}\n\n`
      ).join('');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${this.data.sessionId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
