import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ChatApiService, StreamingResponse } from '../../core/services/chat-api.service';
import { ChatMessage, ModuleType, ConversationSummary } from '../../core/models/api.models';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly chatApi = inject(ChatApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estado
  sidebarOpen = signal(true);
  messages = signal<ChatMessage[]>([]);
  conversations = signal<ConversationSummary[]>([]);
  currentSessionId = signal<string | null>(null);
  selectedModule: ModuleType = 'SUPORTE';
  userInput = '';
  isLoading = signal(false);
  searchQuery = '';
  filteredConversations = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.conversations();
    return this.conversations().filter(c =>
      c.lastMessage?.toLowerCase().includes(query)
    );
  });

  private streamSubscription: Subscription | null = null;

  modules: { value: ModuleType; label: string }[] = [
    { value: 'DESPESA', label: 'Despesa' },
    { value: 'RECEITA', label: 'Receita' },
    { value: 'CUT', label: 'CUT' },
    { value: 'TRIBUTACAO', label: 'Tributação' },
    { value: 'SUPORTE', label: 'Suporte' },
    { value: 'DEV', label: 'Desenvolvimento' }
  ];

  ngOnInit() {
    this.loadConversations();
    this.startNewChat();
  }

  ngOnDestroy() {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  loadConversations() {
    this.chatApi.getUserConversations().subscribe({
      next: (conversations) => {
        this.conversations.set(conversations);
      },
      error: (err) => console.error('Erro ao carregar conversas:', err)
    });
  }

  startNewChat() {
    this.currentSessionId.set(this.chatApi.createNewConversation());
    this.messages.set([]);
  }

  selectConversation(conversation: ConversationSummary) {
    this.currentSessionId.set(conversation.sessionId);
    this.chatApi.getConversationMessages(conversation.sessionId).subscribe({
      next: (data) => {
        const messages: ChatMessage[] = data.messages?.map((m: any) => ({
          id: m.id,
          role: m.type.toLowerCase() as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.timestamp),
          ragScore: m.ragScore,
          feedbackGiven: null
        })) || [];
        this.messages.set(messages);
      },
      error: (err) => console.error('Erro ao carregar mensagens:', err)
    });
  }

  handleEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.userInput,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);

    const requestMessage = this.userInput;
    this.userInput = '';
    this.isLoading.set(true);

    // Criar mensagem de assistente com streaming
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    this.messages.update(msgs => [...msgs, assistantMessage]);

    // Usar streaming
    this.streamSubscription = this.chatApi.sendMessageStream({
      sessionId: this.currentSessionId() || undefined,
      message: requestMessage,
      module: this.selectedModule
    }).subscribe({
      next: (response: StreamingResponse) => {
        this.handleStreamResponse(response, assistantMessage);
      },
      error: (err) => {
        console.error('❌ Erro ao enviar mensagem:', err);

        let errorContent = 'Desculpe, ocorreu um erro ao processar a sua mensagem.';

        if (err.status === 0) {
          errorContent = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
        } else if (err.status === 401) {
          errorContent = 'Não autorizado. Por favor, faça login novamente.';
        } else if (err.status === 403) {
          errorContent = 'Acesso negado.';
        } else if (err.status === 404) {
          errorContent = 'Endpoint não encontrado. Verifique a URL da API.';
        } else if (err.status >= 500) {
          errorContent = `Erro no servidor (${err.status}). Por favor, tente novamente.`;
        }

        assistantMessage.content = errorContent;
        assistantMessage.isStreaming = false;
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      complete: () => {
        assistantMessage.isStreaming = false;
        this.isLoading.set(false);
        this.loadConversations();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Processa eventos de streaming
   */
  private handleStreamResponse(response: StreamingResponse, message: ChatMessage): void {
    switch (response.type) {
      case 'content':
        message.content += response.content || '';
        break;

      case 'done':
        if (response.messageId) {
          message.id = response.messageId;
        }
        if (response.sessionId) {
          this.currentSessionId.set(response.sessionId);
        }
        if (response.ragScore !== undefined) {
          message.ragScore = response.ragScore;
        }
        message.isStreaming = false;
        this.isLoading.set(false);
        break;

      case 'error':
        message.content = response.error || 'Erro desconhecido';
        message.isStreaming = false;
        this.isLoading.set(false);
        break;
    }

    this.cdr.detectChanges();
  }

  submitFeedback(message: ChatMessage, type: 'positive' | 'negative') {
    if (!message.id || message.feedbackGiven) return;

    message.feedbackGiven = type;

    this.chatApi.sendFeedback({
      sessionId: this.currentSessionId()!,
      messageId: message.id,
      feedbackType: type.toUpperCase() as 'POSITIVE' | 'NEGATIVE'
    }).subscribe({
      error: (err) => {
        console.error('Erro ao enviar feedback:', err);
        message.feedbackGiven = null;
      }
    });
  }

  logout() {
    this.auth.logout();
  }

  user() {
    return this.auth.user();
  }
}
