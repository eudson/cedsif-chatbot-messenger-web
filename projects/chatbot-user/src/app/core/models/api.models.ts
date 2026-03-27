/**
 * Modelos da API - Chatbot User
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

export type ModuleType = 'DESPESA' | 'RECEITA' | 'CUT' | 'TRIBUTACAO' | 'SUPORTE' | 'DEV';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface User {
  id: number;
  keycloakId: string;
  username: string;
  email?: string;
  fullName?: string;
  roles: string[];
}

export interface ChatMessage {
  id?: number;
  role: MessageRole;
  content: string;
  timestamp: Date;
  ragScore?: number;
  sources?: string[];
  isStreaming?: boolean;
  feedbackGiven?: 'positive' | 'negative' | null;
}

export interface ConversationSummary {
  id: number;
  sessionId: string;
  module: ModuleType;
  messageCount: number;
  lastMessage?: string;
  createdAt: string;
  lastActivityAt: string;
  satisfaction?: number;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  module: ModuleType;
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
  feedbackType: 'POSITIVE' | 'NEGATIVE';
  comment?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
