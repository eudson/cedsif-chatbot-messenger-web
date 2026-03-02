import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  sources?: RagSource[];
  feedbackGiven?: 'positive' | 'negative' | null;
  isStreaming?: boolean;
}

export interface RagSource {
  title: string;
  url?: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface StreamingResponse {
  type: 'content' | 'sources' | 'done' | 'error';
  content?: string;
  sources?: RagSource[];
  messageId?: string;
  error?: string;
}

export interface FeedbackRequest {
  messageId: string;
  feedback: 'positive' | 'negative';
  comment?: string;
}

export interface EscalateRequest {
  conversationId: string;
  module: string;
  description: string;
  userEmail?: string;
}

export interface EscalateResponse {
  ticketId: string;
  ticketUrl?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8080';
  private conversationId: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Sets the base URL for API calls
   */
  setBaseUrl(url: string): void {
    // Remove trailing slash
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Gets the JWT token from e-SISTAFE header or localStorage
   */
  private getAuthToken(): string | null {
    // Try to get from meta tag first (set by e-SISTAFE)
    const metaToken = document.querySelector('meta[name="x-esistafe-token"]');
    if (metaToken) {
      return metaToken.getAttribute('content');
    }

    // Fallback to localStorage
    return localStorage.getItem('esistafe_token');
  }

  /**
   * Creates HTTP headers with authentication
   */
  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.getAuthToken();
    if (token) {
      headers = headers.set('X-eSISTAFE-Token', token);
    }

    if (this.conversationId) {
      headers = headers.set('X-Conversation-Id', this.conversationId);
    }

    return headers;
  }

  /**
   * Sends a message and receives streaming response via SSE
   */
  sendMessageStream(message: string, module: string): Observable<StreamingResponse> {
    const subject = new Subject<StreamingResponse>();

    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['X-eSISTAFE-Token'] = token;
    }

    if (this.conversationId) {
      headers['X-Conversation-Id'] = this.conversationId;
    }

    const body = JSON.stringify({
      message,
      module,
      sessionId: this.conversationId  // Backend espera 'sessionId', não 'conversationId'
    });

    console.log('📤 Enviando mensagem:', {
      messageLength: message.length,
      module,
      sessionId: this.conversationId,
      messagePreview: message.substring(0, 200) + '...'
    });

    // Use fetch with SSE for streaming
    fetch(`${this.baseUrl}/v1/chat/message`, {
      method: 'POST',
      headers,
      body
    }).then(async response => {
      if (!response.ok) {
        // Tentar ler o corpo do erro
        const errorText = await response.text().catch(() => 'Não foi possível ler a resposta');
        console.error('❌ Erro HTTP:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        subject.next({
          type: 'error',
          error: `HTTP error! status: ${response.status} - ${errorText}`
        });
        subject.complete();
        return;
      }

      // Get conversation ID from response header
      const convId = response.headers.get('X-Conversation-Id');
      if (convId) {
        this.conversationId = convId;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        subject.next({
          type: 'error',
          error: 'No response body'
        });
        subject.complete();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            subject.next({ type: 'done' });
            subject.complete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';

          for (const line of lines) {
            // Capturar nome do evento (event: nome)
            if (line.startsWith('event: ') || line.startsWith('event:')) {
              currentEvent = line.startsWith('event: ') ? line.slice(7).trim() : line.slice(6).trim();
              console.log('📡 SSE event:', currentEvent);
              continue;
            }

            // Handle both "data: " and "data:" formats (SSE spec allows both)
            let data = '';
            if (line.startsWith('data: ')) {
              data = line.slice(6);
            } else if (line.startsWith('data:')) {
              data = line.slice(5);
            } else {
              continue;
            }

            console.log('📦 SSE data received (event=' + currentEvent + '):', data);

            if (data === '[DONE]') {
              subject.next({ type: 'done' });
              currentEvent = '';
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // Evento 'end' com messageId
              if (currentEvent === 'end' || (parsed.sessionId && parsed.messageId)) {
                console.log('✅ Evento END com messageId:', parsed.messageId);
                subject.next({
                  type: 'done',
                  messageId: String(parsed.messageId)
                });
              }
              // Evento 'token' com conteúdo
              else if (currentEvent === 'token' || parsed.content) {
                subject.next({
                  type: 'content',
                  content: parsed.content,
                  messageId: parsed.messageId
                });
              }
              // Evento 'start' - capturar sessionId
              else if (currentEvent === 'start') {
                console.log('🎬 Streaming iniciado:', parsed);
                if (parsed.sessionId) {
                  this.conversationId = parsed.sessionId;
                  console.log('📌 SessionId capturado:', this.conversationId);
                }
              }

              if (parsed.sources) {
                subject.next({
                  type: 'sources',
                  sources: parsed.sources
                });
              }

              if (parsed.error) {
                subject.next({
                  type: 'error',
                  error: parsed.error
                });
              }
            } catch (e) {
              // Plain text content
              console.log('SSE parse error, using as plain text:', data);
              subject.next({
                type: 'content',
                content: data
              });
            }

            currentEvent = ''; // Reset após processar
          }
        }
      } catch (error) {
        subject.next({
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream error'
        });
        subject.complete();
      }
    }).catch(error => {
      subject.next({
        type: 'error',
        error: error instanceof Error ? error.message : 'Network error'
      });
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Submits feedback for a message
   */
  submitFeedback(request: FeedbackRequest): Observable<void> {
    const payload = {
      sessionId: this.conversationId || '',
      messageId: request.messageId ? parseInt(request.messageId) : null,
      feedbackType: request.feedback.toUpperCase(),
      comment: request.comment
    };

    return this.http.post<void>(
      `${this.baseUrl}/v1/chat/feedback`,
      payload,
      { headers: this.createHeaders() }
    );
  }

  /**
   * Escalates conversation to GLPI support
   */
  escalateToSupport(request: EscalateRequest): Observable<EscalateResponse> {
    return this.http.post<EscalateResponse>(
      `${this.baseUrl}/incident/escalate`,
      {
        ...request,
        conversationId: this.conversationId || request.conversationId
      },
      { headers: this.createHeaders() }
    );
  }

  /**
   * Gets the current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Starts a new conversation
   */
  resetConversation(): void {
    this.conversationId = null;
  }
}
