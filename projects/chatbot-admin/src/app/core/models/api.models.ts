/**
 * Modelos da API CEDSIF Chatbot
 */

// Resposta genérica da API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
  path?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

// Paginação (suporta formato VIA_DTO do Spring)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  // Formato VIA_DTO (paginação aninhada)
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Enums
export type ModuleType = 'DESPESA' | 'RECEITA' | 'CUT' | 'TRIBUTACAO' | 'SUPORTE' | 'DEV';
export type MessageType = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type FeedbackType = 'POSITIVE' | 'NEGATIVE';
export type IncidentStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO' | 'CANCELADO';
export type IncidentPriority = 'MUITO_ALTA' | 'ALTA' | 'MEDIA' | 'BAIXA';

// Chat
export interface ChatRequest {
  sessionId?: string;
  message: string;
  module?: ModuleType;
  sourceUrl?: string;
  stream?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  messageId?: number;
  response: string;
  module: ModuleType;
  ragScore?: number;
  sources?: string[];
  modelUsed?: string;
  responseTimeMs?: number;
  escalated?: boolean;
  glpiTicketId?: number;
}

export interface FeedbackRequest {
  sessionId: string;
  messageId?: number;
  feedbackType: FeedbackType;
  comment?: string;
}

// Conversas
export interface ConversationSummary {
  id: number;
  sessionId: string;
  username: string;
  module: ModuleType;
  messageCount: number;
  escalated: boolean;
  satisfaction?: number;
  createdAt: string;
  lastActivity?: string;
}

export interface ConversationDetail extends ConversationSummary {
  email?: string;
  sourceUrl?: string;
  summary?: string;
  messages: MessageSummary[];
}

export interface MessageSummary {
  id: number;
  type: MessageType;
  content: string;
  ragScore?: number;
  timestamp: string;
}

// Documentos
export interface DocumentSummary {
  id: number;
  fileName: string;
  title?: string;
  module: ModuleType;
  chunkCount: number;
  fileSize: number;
  active: boolean;
  lastIndexedAt?: string;
}

export interface CollectionStats {
  collectionName: string;
  module: string;
  documentCount: number;
  chunkCount: number;
}

// Incidentes
export interface GlpiIncident {
  id: number;
  conversationId: number;
  glpiTicketId?: number;
  title: string;
  description?: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  category?: string;
  escalationReason?: string;
  slaDueDate?: string;
  resolvedAt?: string;
  assignedTechnician?: string;
  createdAt: string;
}

// Analytics
export interface DashboardData {
  general: GeneralMetrics;
  modules: ModuleMetrics[];
  startDate: string;
  endDate: string;
}

export interface GeneralMetrics {
  totalConversations: number;
  escalatedCount: number;
  escalationRate: number;
  avgResponseTimeMs: number;
  openIncidents: number;
  incidentsCreated: number;
  avgSatisfaction: number;
}

export interface ModuleMetrics {
  module: string;
  description: string;
  conversationCount: number;
  satisfactionScore: number;
  documentCount: number;
}

export interface IncidentMetrics {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  slaBreached: number;
}

// User
export interface User {
  id: number;
  keycloakId: string;
  username: string;
  email?: string;
  fullName?: string;
  roles: string[];
}
