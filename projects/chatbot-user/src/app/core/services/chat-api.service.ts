import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  ConversationSummary,
  FeedbackRequest,
  ModuleType
} from '../models/api.models';
import { AuthService } from '../auth/auth.service';

export interface StreamingResponse {
  type: 'content' | 'sources' | 'done' | 'error';
  content?: string;
  messageId?: number;
  sessionId?: string;
  ragScore?: number;
  module?: ModuleType;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private createHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /**
   * Envia uma mensagem no chat usando SSE streaming
   * Retorna um Observable que emite eventos de streaming
   */
  sendMessageStream(request: ChatRequest): Observable<StreamingResponse> {
    const subject = new Subject<StreamingResponse>();
    const url = `${this.baseUrl}/v1/chat/message`;
    const token = this.auth.getToken();

    console.log('📤 Enviando mensagem para:', url);
    console.log('📦 Payload:', request);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = JSON.stringify(request);

    fetch(url, {
      method: 'POST',
      headers,
      body
    }).then(async response => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        console.error('❌ Erro HTTP:', response.status, errorText);
        subject.next({
          type: 'error',
          error: `HTTP error! status: ${response.status} - ${errorText}`
        });
        subject.complete();
        return;
      }

      // Obter sessionId do header
      const sessionId = response.headers.get('X-Conversation-Id') || request.sessionId;

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
      let messageId: number | undefined;
      let ragScore: number | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('✅ Stream completo');
            subject.next({
              type: 'done',
              messageId,
              sessionId: sessionId || '',
              ragScore,
              module: request.module
            });
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
              continue;
            }

            // Handle both "data: " and "data:" formats
            let data = '';
            if (line.startsWith('data: ')) {
              data = line.slice(6);
            } else if (line.startsWith('data:')) {
              data = line.slice(5);
            } else {
              continue;
            }

            if (data === '[DONE]') {
              subject.next({
                type: 'done',
                messageId,
                sessionId: sessionId || '',
                ragScore,
                module: request.module
              });
              currentEvent = '';
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // Evento 'end' com messageId
              if (currentEvent === 'end' || (parsed.sessionId && parsed.messageId)) {
                console.log('✅ Evento END com messageId:', parsed.messageId);
                messageId = parsed.messageId;
                ragScore = parsed.ragScore;
                subject.next({
                  type: 'done',
                  messageId: parsed.messageId,
                  sessionId: parsed.sessionId || sessionId || '',
                  ragScore: parsed.ragScore
                });
              }
              // Evento 'token' com conteúdo
              else if (currentEvent === 'token' || parsed.content) {
                subject.next({
                  type: 'content',
                  content: parsed.content
                });
              }
              // Evento 'start' - capturar sessionId
              else if (currentEvent === 'start') {
                console.log('🎬 Streaming iniciado:', parsed);
              }
              // Evento metadata
              else if (parsed.type === 'metadata') {
                messageId = parsed.messageId;
                ragScore = parsed.ragScore;
              }

            } catch (e) {
              // Plain text content
              subject.next({
                type: 'content',
                content: data
              });
            }

            currentEvent = '';
          }
        }
      } catch (error) {
        console.error('❌ Erro no streaming:', error);
        subject.next({
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream error'
        });
        subject.complete();
      }
    }).catch(error => {
      console.error('❌ Erro na requisição:', error);
      subject.next({
        type: 'error',
        error: error instanceof Error ? error.message : 'Network error'
      });
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Envia uma mensagem no chat (versão não-streaming para compatibilidade)
   */
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return new Observable<ChatResponse>(observer => {
      let fullResponse = '';
      let messageId: number | undefined;
      let sessionId: string | undefined;
      let ragScore: number | undefined;

      this.sendMessageStream(request).subscribe({
        next: (response) => {
          if (response.type === 'content' && response.content) {
            fullResponse += response.content;
          } else if (response.type === 'done') {
            messageId = response.messageId;
            sessionId = response.sessionId;
            ragScore = response.ragScore;
          }
        },
        error: (err) => observer.error(err),
        complete: () => {
          observer.next({
            sessionId: sessionId || request.sessionId || '',
            messageId,
            response: fullResponse,
            module: request.module,
            ragScore
          });
          observer.complete();
        }
      });
    });
  }

  /**
   * Envia feedback sobre uma mensagem
   */
  sendFeedback(feedback: FeedbackRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}/v1/chat/feedback`,
      feedback,
      { headers: this.createHeaders() }
    ).pipe(
      map(() => undefined)
    );
  }

  /**
   * Obtém o histórico de conversas do utilizador
   */
  getUserConversations(page = 0, size = 20): Observable<ConversationSummary[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'lastActivityAt,desc');

    return this.http.get<ApiResponse<{ content: ConversationSummary[] }>>(
      `${this.baseUrl}/v1/user/conversations`,
      { headers: this.createHeaders(), params }
    ).pipe(
      map(response => response.data?.content || [])
    );
  }

  /**
   * Obtém as mensagens de uma conversa específica
   */
  getConversationMessages(sessionId: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/user/conversations/${sessionId}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Pesquisa conversas por texto
   */
  searchConversations(query: string): Observable<ConversationSummary[]> {
    let params = new HttpParams().set('q', query);

    return this.http.get<ApiResponse<ConversationSummary[]>>(
      `${this.baseUrl}/v1/user/conversations/search`,
      { headers: this.createHeaders(), params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Cria uma nova conversa
   */
  createNewConversation(): string {
    return crypto.randomUUID();
  }
}
