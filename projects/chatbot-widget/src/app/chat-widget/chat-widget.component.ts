import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  Input,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChatService, ChatMessage, RagSource, StreamingResponse } from '../services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [ChatService]
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() module: string = '';
  @Input() apiUrl: string = '/api/v1';
  @Input() position: 'bottom-right' | 'bottom-left' = 'bottom-right';
  @Input() primaryColor: string = '#1976d2';
  @Input() title: string = 'Assistente e-SISTAFE';

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  isOpen = false;
  isMinimized = false;
  messages: ChatMessage[] = [];
  inputMessage = '';
  isLoading = false;
  showEscalateForm = false;
  escalateDescription = '';
  escalateEmail = '';
  showFeedbackTooltip: string | null = null;

  private streamSubscription: Subscription | null = null;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Ler atributos HTML (kebab-case) para Web Component
    this.readAttributesFromHost();

    // Auto-detect module from data attribute or URL
    this.detectModule();

    // Set API URL
    if (this.apiUrl) {
      this.chatService.setBaseUrl(this.apiUrl);
    }

    // Add welcome message
    this.addSystemMessage(
      `Olá! Sou o assistente virtual do e-SISTAFE. Como posso ajudá-lo hoje?`
    );
  }

  /**
   * Lê atributos HTML do elemento host (para Web Components)
   */
  private readAttributesFromHost(): void {
    const element = this.elementRef.nativeElement as HTMLElement;

    // Ler api-url
    const apiUrl = element.getAttribute('api-url');
    if (apiUrl) {
      this.apiUrl = apiUrl;
    }

    // Ler module
    const module = element.getAttribute('module');
    if (module) {
      this.module = module;
    }

    // Ler title
    const title = element.getAttribute('title');
    if (title) {
      this.title = title;
    }

    // Ler position
    const position = element.getAttribute('position');
    if (position === 'bottom-left' || position === 'bottom-right') {
      this.position = position;
    }

    // Ler primary-color
    const primaryColor = element.getAttribute('primary-color');
    if (primaryColor) {
      this.primaryColor = primaryColor;
    }
  }

  ngOnDestroy(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Detects the current module from URL or data attribute
   */
  private detectModule(): void {
    if (this.module) {
      return;
    }

    // Try to get from data attribute
    const dataModule = this.elementRef.nativeElement.getAttribute('data-module');
    if (dataModule) {
      this.module = dataModule;
      return;
    }

    // Auto-detect from URL path
    const path = window.location.pathname.toLowerCase();

    if (path.includes('/execucao') || path.includes('/exec')) {
      this.module = 'execucao';
    } else if (path.includes('/contabilidade') || path.includes('/cont')) {
      this.module = 'contabilidade';
    } else if (path.includes('/orcamento') || path.includes('/orc')) {
      this.module = 'orcamento';
    } else if (path.includes('/patrimonio') || path.includes('/pat')) {
      this.module = 'patrimonio';
    } else if (path.includes('/recursos-humanos') || path.includes('/rh')) {
      this.module = 'recursos-humanos';
    } else if (path.includes('/divida') || path.includes('/div')) {
      this.module = 'divida';
    } else {
      this.module = 'geral';
    }
  }

  /**
   * Toggles the chat window
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.isMinimized = false;

    if (this.isOpen) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Minimizes the chat window
   */
  minimizeChat(): void {
    this.isMinimized = !this.isMinimized;
  }

  /**
   * Closes the chat window
   */
  closeChat(): void {
    this.isOpen = false;
  }

  /**
   * Sends a message
   */
  sendMessage(): void {
    const message = this.inputMessage.trim();
    if (!message || this.isLoading) {
      return;
    }

    // Add user message
    this.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      id: `user-${Date.now()}` // ID local único
    });

    this.inputMessage = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      id: `assistant-${Date.now()}` // ID local único
    };
    this.messages.push(assistantMessage);

    // Stream response
    this.streamSubscription = this.chatService
      .sendMessageStream(message, this.module)
      .subscribe({
        next: (response: StreamingResponse) => {
          this.handleStreamResponse(response, assistantMessage);
        },
        error: (error) => {
          console.error('Chat error:', error);
          assistantMessage.content = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
          assistantMessage.isStreaming = false;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          assistantMessage.isStreaming = false;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handles streaming response chunks
   */
  private handleStreamResponse(response: StreamingResponse, message: ChatMessage): void {
    switch (response.type) {
      case 'content':
        message.content += response.content || '';
        if (response.messageId) {
          message.id = response.messageId;
        }
        this.shouldScrollToBottom = true;
        break;

      case 'sources':
        message.sources = response.sources;
        break;

      case 'done':
        if (response.messageId) {
          message.id = response.messageId;
          console.log('✅ MessageId setado:', response.messageId);
        } else {
          console.warn('⚠️ Evento done sem messageId:', response);
        }
        message.isStreaming = false;
        this.isLoading = false;
        console.log('📝 Mensagem final:', {
          id: message.id,
          role: message.role,
          isStreaming: message.isStreaming,
          shouldShowFeedback: message.role === 'assistant' && !!message.id && !message.isStreaming
        });
        break;

      case 'error':
        message.content = response.error || 'Erro desconhecido';
        message.isStreaming = false;
        this.isLoading = false;
        break;
    }

    this.cdr.detectChanges();
  }

  /**
   * Adds a system message
   */
  private addSystemMessage(content: string): void {
    this.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date()
    });
  }

  /**
   * Scrolls messages container to bottom
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Handles keyboard events in input
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Submits positive feedback
   */
  submitPositiveFeedback(message: ChatMessage): void {
    if (!message.id || message.feedbackGiven) {
      return;
    }

    this.chatService.submitFeedback({
      messageId: message.id,
      feedback: 'positive'
    }).subscribe({
      next: () => {
        message.feedbackGiven = 'positive';
        this.showFeedbackTooltip = message.id || null;
        setTimeout(() => this.showFeedbackTooltip = null, 2000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Feedback error:', error);
      }
    });
  }

  /**
   * Submits negative feedback
   */
  submitNegativeFeedback(message: ChatMessage): void {
    if (!message.id || message.feedbackGiven) {
      return;
    }

    this.chatService.submitFeedback({
      messageId: message.id,
      feedback: 'negative'
    }).subscribe({
      next: () => {
        message.feedbackGiven = 'negative';
        this.showFeedbackTooltip = message.id || null;
        setTimeout(() => this.showFeedbackTooltip = null, 2000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Feedback error:', error);
      }
    });
  }

  /**
   * Shows the escalation form
   */
  showEscalateDialog(): void {
    this.showEscalateForm = true;
  }

  /**
   * Hides the escalation form
   */
  hideEscalateDialog(): void {
    this.showEscalateForm = false;
    this.escalateDescription = '';
    this.escalateEmail = '';
  }

  /**
   * Escalates to GLPI support
   */
  escalateToSupport(): void {
    if (!this.escalateDescription.trim()) {
      return;
    }

    this.isLoading = true;

    this.chatService.escalateToSupport({
      conversationId: this.chatService.getConversationId() || '',
      module: this.module,
      description: this.escalateDescription,
      userEmail: this.escalateEmail || undefined
    }).subscribe({
      next: (response) => {
        this.hideEscalateDialog();
        this.addSystemMessage(
          `Seu chamado foi aberto com sucesso! Número do ticket: ${response.ticketId}. ` +
          `Nossa equipe de suporte entrará em contato em breve.`
        );
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Escalation error:', error);
        this.addSystemMessage(
          'Desculpe, não foi possível abrir o chamado. Por favor, tente novamente ou entre em contato pelo e-mail suporte@cedsif.gov.mz'
        );
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Starts a new conversation
   */
  startNewConversation(): void {
    this.chatService.resetConversation();
    this.messages = [];
    this.addSystemMessage(
      `Olá! Sou o assistente virtual do e-SISTAFE. Como posso ajudá-lo hoje?`
    );
    this.cdr.detectChanges();
  }

  /**
   * Analisa o erro da página automaticamente
   */
  analyzePageError(): void {
    try {
      let errorContent = '';

      // O widget e os erros estão no mesmo documento (frame-content.html)
      // Usar document diretamente
      const errorBox = document.querySelector('.error-box');
      const warningBox = document.querySelector('.warning-box');
      const detailsBox = document.querySelector('.details-box');
      const contentDiv = document.querySelector('.contentDiv');

      console.log('Debug - errorBox:', errorBox);
      console.log('Debug - warningBox:', warningBox);
      console.log('Debug - detailsBox:', detailsBox);
      console.log('Debug - contentDiv:', contentDiv);

      // 1. Capturar mensagem de erro ou warning
      let errorMessage = '';
      let messageType = '';

      if (errorBox) {
        errorMessage = errorBox.querySelector('.error_message')?.textContent || '';
        messageType = 'ERRO';
      } else if (warningBox) {
        errorMessage = warningBox.querySelector('.warning_message')?.textContent || '';
        messageType = 'AVISO';
      }

      // 2. Capturar detalhes técnicos (stack trace ou tabela)
      let technicalDetails = '';
      if (detailsBox) {
        const stackTraceDiv = detailsBox.querySelector('.stack-trace-content');
        const approvalTable = detailsBox.querySelector('.aprovacoes-table');

        if (stackTraceDiv) {
          technicalDetails = stackTraceDiv.textContent || '';
        } else if (approvalTable) {
          technicalDetails = approvalTable.outerHTML || '';
        } else {
          // Pegar todo o conteúdo da details-box
          technicalDetails = detailsBox.textContent || '';
        }
      }

      // 3. Capturar conteúdo completo da página para contexto
      let pageContext = '';
      if (contentDiv) {
        pageContext = contentDiv.textContent?.trim() || '';
      }

      // Montar mensagem completa (SEM EMOJIS - causam problemas de codificação)
      if (errorMessage) {
        errorContent = `===============================================\n`;
        errorContent += `${messageType} DETECTADO NA APLICACAO e-SISTAFE\n`;
        errorContent += `===============================================\n\n`;

        errorContent += `MENSAGEM:\n${errorMessage.trim()}\n\n`;

        if (technicalDetails && technicalDetails.trim()) {
          errorContent += `DETALHES TECNICCOS:\n`;
          errorContent += `${technicalDetails.trim()}\n`;
        }

        errorContent += `===============================================\n`;
      } else {
        errorContent = 'Nao foi possivel detectar erros automaticamente. Por favor, descreva o problema que esta enfrentando.';
      }

      // LIMITE DE 4000 CARACTERES (backend validation)
      const MAX_MESSAGE_LENGTH = 3900; // Deixar margem de segurança

      if (errorContent.length > MAX_MESSAGE_LENGTH) {
        console.warn(`Mensagem muito grande (${errorContent.length} chars), truncando para ${MAX_MESSAGE_LENGTH}`);
        errorContent = errorContent.substring(0, MAX_MESSAGE_LENGTH) + '\n\n[... mensagem truncada devido ao tamanho]';
      }

      // Enviar para o chat automaticamente
      if (errorContent && errorContent.length > 50 && !errorContent.includes('Nao foi possivel detectar')) {
        this.inputMessage = `Encontrei este erro no e-SISTAFE e preciso de ajuda para resolver:\n\n${errorContent}`;
        this.sendMessage();
      } else {
        this.addSystemMessage(
          'Nao foi possivel detectar erros automaticamente. Por favor, descreva o problema que esta enfrentando.'
        );
      }
    } catch (error) {
      console.error('Erro ao capturar conteúdo da página:', error);
      this.addSystemMessage(
        'Erro ao analisar a página. Por favor, descreva manualmente o problema que está enfrentando.'
      );
    }
  }

  /**
   * Formats a source for display
   */
  formatSource(source: RagSource): string {
    return source.title || source.url || 'Fonte';
  }

  /**
   * Opens a source URL
   */
  openSource(source: RagSource): void {
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Gets CSS custom properties for theming
   */
  get customStyles(): { [key: string]: string } {
    return {
      '--primary-color': this.primaryColor,
      '--position-right': this.position === 'bottom-right' ? '20px' : 'auto',
      '--position-left': this.position === 'bottom-left' ? '20px' : 'auto'
    };
  }
}
