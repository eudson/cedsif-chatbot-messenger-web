import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, Page, ModuleType,
  ConversationSummary, ConversationDetail,
  DocumentSummary, CollectionStats,
  DashboardData, IncidentMetrics,
  GlpiIncident, FeedbackRequest
} from '../models/api.models';

/**
 * Normaliza resposta paginada do Spring (suporta VIA_DTO e formato clássico)
 */
function normalizePage<T>(page: Page<T>): Page<T> {
  // Se tem paginação aninhada (formato VIA_DTO), extrair para nível superior
  if (page.page) {
    return {
      content: page.content,
      totalElements: page.page.totalElements,
      totalPages: page.page.totalPages,
      size: page.page.size,
      number: page.page.number
    };
  }
  return page;
}

/**
 * Serviço base para comunicação com a API.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ============ Conversations ============

  getConversations(
    page = 0,
    size = 20,
    module?: ModuleType,
    escalated?: boolean
  ): Observable<Page<ConversationSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (module) params = params.set('module', module);
    if (escalated !== undefined) params = params.set('escalated', escalated.toString());

    return this.http.get<ApiResponse<Page<ConversationSummary>>>(
      `${this.baseUrl}/v1/admin/conversations`, { params }
    ).pipe(map(r => normalizePage(r.data!)));
  }

  getConversation(id: number): Observable<ConversationDetail> {
    return this.http.get<ApiResponse<ConversationDetail>>(
      `${this.baseUrl}/v1/admin/conversations/${id}`
    ).pipe(map(r => r.data!));
  }

  // ============ Knowledge Base ============

  getDocuments(
    page = 0,
    size = 20,
    module?: ModuleType
  ): Observable<Page<DocumentSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (module) params = params.set('module', module);

    return this.http.get<ApiResponse<Page<DocumentSummary>>>(
      `${this.baseUrl}/v1/knowledge/documents`, { params }
    ).pipe(map(r => normalizePage(r.data!)));
  }

  uploadDocument(file: File, module: ModuleType): Observable<DocumentSummary> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    return this.http.post<ApiResponse<DocumentSummary>>(
      `${this.baseUrl}/v1/knowledge/documents`, formData
    ).pipe(map(r => r.data!));
  }

  reindexDocuments(module?: ModuleType, documentId?: number): Observable<{ documentsProcessed: number }> {
    let params = new HttpParams();
    if (module) params = params.set('module', module);
    if (documentId) params = params.set('documentId', documentId.toString());

    return this.http.post<ApiResponse<{ documentsProcessed: number }>>(
      `${this.baseUrl}/v1/knowledge/reindex`, null, { params }
    ).pipe(map(r => r.data!));
  }

  getCollectionStats(): Observable<CollectionStats[]> {
    return this.http.get<ApiResponse<CollectionStats[]>>(
      `${this.baseUrl}/v1/knowledge/collections`
    ).pipe(map(r => r.data!));
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/v1/knowledge/documents/${id}`
    ).pipe(map(() => undefined));
  }

  activateDocument(id: number): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/v1/knowledge/documents/${id}/activate`,
      {}
    ).pipe(map(() => undefined));
  }

  // ============ Analytics ============

  getDashboard(startDate?: string, endDate?: string): Observable<DashboardData> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<DashboardData>>(
      `${this.baseUrl}/v1/admin/analytics`, { params }
    ).pipe(map(r => r.data!));
  }

  getIncidentMetrics(): Observable<IncidentMetrics> {
    return this.http.get<ApiResponse<IncidentMetrics>>(
      `${this.baseUrl}/v1/admin/analytics/incidents`
    ).pipe(map(r => r.data!));
  }

  // ============ Incidents ============

  getIncidents(
    page = 0,
    size = 20,
    status?: string
  ): Observable<Page<GlpiIncident>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<Page<GlpiIncident>>>(
      `${this.baseUrl}/v1/admin/incidents`, { params }
    ).pipe(map(r => normalizePage(r.data!)));
  }

  getPendingIncidents(page = 0, size = 20): Observable<Page<GlpiIncident>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<Page<GlpiIncident>>>(
      `${this.baseUrl}/v1/admin/incidents/pending`, { params }
    ).pipe(map(r => normalizePage(r.data!)));
  }

  getResolvedIncidents(page = 0, size = 20): Observable<Page<GlpiIncident>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<Page<GlpiIncident>>>(
      `${this.baseUrl}/v1/admin/incidents/resolved`, { params }
    ).pipe(map(r => normalizePage(r.data!)));
  }

  getIncident(id: number): Observable<GlpiIncident> {
    return this.http.get<ApiResponse<GlpiIncident>>(
      `${this.baseUrl}/v1/admin/incidents/${id}`
    ).pipe(map(r => r.data!));
  }

  getIncidentStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/incidents/stats`
    ).pipe(map(r => r.data!));
  }

  // ============ System Prompts ============

  getAllPrompts(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/v1/admin/prompts`
    ).pipe(map(r => r.data!));
  }

  getPromptByModule(module: ModuleType): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/prompts/${module}`
    ).pipe(map(r => r.data!));
  }

  savePrompt(module: ModuleType, data: { name: string; content: string; version?: string }): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/prompts/${module}`, data
    ).pipe(map(r => r.data!));
  }

  updatePrompt(id: number, data: { name: string; content: string; version?: string }): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/prompts/${id}`, data
    ).pipe(map(r => r.data!));
  }

  deactivatePrompt(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/v1/admin/prompts/${id}`
    ).pipe(map(() => undefined));
  }

  resetPromptToDefault(module: ModuleType): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/prompts/${module}/reset`, null
    ).pipe(map(r => r.data!));
  }

  // ============ Module Configs (RAG Settings) ============

  getAllModuleConfigs(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/v1/admin/module-configs`
    ).pipe(map(r => r.data!));
  }

  getModuleConfig(module: ModuleType): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/module-configs/${module}`
    ).pipe(map(r => r.data!));
  }

  saveModuleConfig(module: ModuleType, data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/module-configs/${module}`, data
    ).pipe(map(r => r.data!));
  }

  resetModuleConfigToDefault(module: ModuleType): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/admin/module-configs/${module}/reset`, null
    ).pipe(map(r => r.data!));
  }

  deactivateModuleConfig(module: ModuleType): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/v1/admin/module-configs/${module}`
    ).pipe(map(() => undefined));
  }

  // ============ Chat ============

  sendFeedback(feedback: FeedbackRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}/v1/chat/feedback`, feedback
    ).pipe(map(() => undefined));
  }
}
