import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';

interface IntegrationConfig {
  type: string;
  displayName: string;
  description: string;
  enabled: boolean;
  available: boolean;
  configs: Record<string, string>;
  environment: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule,
    MatChipsModule, MatExpansionModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1>Configurações</h1>
      <span class="subtitle">Configurações do sistema e módulos</span>
    </div>

    <mat-card>
      <mat-tab-group>
        <!-- Tab: System Prompts -->
        <mat-tab label="System Prompts">
          <div class="tab-content">
            <h2>Configuração de Prompts por Módulo</h2>
            <p class="description">
              Configure as instruções (prompts) que o modelo de IA seguirá ao responder perguntas de cada módulo.
            </p>

            <mat-divider></mat-divider>

            <div class="prompt-editor">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Módulo</mat-label>
                <mat-select [(ngModel)]="selectedModule" (selectionChange)="loadPrompt()">
                  <mat-option value="DESPESA">Despesa</mat-option>
                  <mat-option value="RECEITA">Receita</mat-option>
                  <mat-option value="CUT">CUT</mat-option>
                  <mat-option value="TRIBUTACAO">Tributação</mat-option>
                  <mat-option value="SUPORTE">Suporte</mat-option>
                  <mat-option value="DEV">Desenvolvimento</mat-option>
                </mat-select>
              </mat-form-field>

              @if (loading()) {
                <div class="loading"><mat-spinner></mat-spinner></div>
              } @else if (selectedModule) {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nome do Prompt</mat-label>
                  <input matInput [(ngModel)]="promptName">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>System Prompt</mat-label>
                  <textarea matInput [(ngModel)]="promptContent" rows="15"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Versão</mat-label>
                  <input matInput [(ngModel)]="promptVersion" placeholder="1.0">
                </mat-form-field>

                <div class="actions">
                  <button mat-raised-button color="primary" (click)="savePrompt()" [disabled]="saving()">
                    <mat-icon>save</mat-icon>
                    {{ saving() ? 'Salvando...' : 'Salvar Prompt' }}
                  </button>
                  <button mat-raised-button (click)="resetPrompt()" [disabled]="saving()">
                    <mat-icon>refresh</mat-icon>
                    Restaurar Padrão
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Configurações RAG -->
        <mat-tab label="Configurações RAG">
          <div class="tab-content">
            <h2>Configuração RAG e LLM por Módulo</h2>
            <p class="description">
              Configure os parâmetros de RAG e do modelo de linguagem.
              <strong>Atenção:</strong> Valores incorretos podem causar alucinações.
            </p>

            <mat-divider></mat-divider>

            <div class="prompt-editor">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Módulo</mat-label>
                <mat-select [(ngModel)]="selectedRagModule" (selectionChange)="loadRagConfig()">
                  <mat-option value="DESPESA">Despesa</mat-option>
                  <mat-option value="RECEITA">Receita</mat-option>
                  <mat-option value="CUT">CUT</mat-option>
                  <mat-option value="TRIBUTACAO">Tributação</mat-option>
                  <mat-option value="SUPORTE">Suporte</mat-option>
                  <mat-option value="DEV">Desenvolvimento</mat-option>
                </mat-select>
              </mat-form-field>

              @if (loadingRag()) {
                <div class="loading"><mat-spinner></mat-spinner></div>
              } @else if (selectedRagModule) {
                <div class="settings-section">
                  <h3>Parâmetros de Busca (RAG)</h3>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Top-K (Documentos Recuperados)</mat-label>
                    <input matInput type="number" [(ngModel)]="ragTopK" min="1" max="20">
                    <mat-hint>Número de chunks similares a recuperar (recomendado: 10)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Similarity Threshold</mat-label>
                    <input matInput type="number" [(ngModel)]="ragSimilarityThreshold" step="0.05" min="0" max="1">
                    <mat-hint>Limiar de similaridade para incluir documentos (0.30 = mais permissivo, 0.70 = muito restritivo)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Escalation Threshold</mat-label>
                    <input matInput type="number" [(ngModel)]="ragEscalationThreshold" step="0.05" min="0" max="1">
                    <mat-hint>Quando escalar para GLPI por baixa confiança (recomendado: 0.65)</mat-hint>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="settings-section">
                  <h3>Parâmetros do Modelo LLM</h3>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Modelo LLM</mat-label>
                    <input matInput [(ngModel)]="ragModel">
                    <mat-hint>Modelo Ollama a usar (ex: qwen2.5:14b, llama3.1:8b)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Temperature</mat-label>
                    <input matInput type="number" [(ngModel)]="ragTemperature" step="0.1" min="0" max="2">
                    <mat-hint>Controla criatividade vs precisão (0.2 = preciso, 0.7 = criativo/alucinações)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Max Tokens</mat-label>
                    <input matInput type="number" [(ngModel)]="ragMaxTokens" min="512" max="4096">
                    <mat-hint>Máximo de tokens na resposta (recomendado: 2048)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Palavras-chave de Escalação</mat-label>
                    <input matInput [(ngModel)]="ragEscalationKeywords" placeholder="urgente,crítico,erro grave">
                    <mat-hint>Palavras que disparam escalação automática (separadas por vírgula)</mat-hint>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="settings-section">
                  <h3>Configurações de Escalação Automática</h3>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Frases de Resposta Incerta</mat-label>
                    <textarea matInput [(ngModel)]="ragUncertainResponsePhrases" rows="4"></textarea>
                    <mat-hint>Frases que indicam que o LLM não conseguiu responder (separadas por vírgula)</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Feedbacks Negativos para Escalação</mat-label>
                    <input matInput type="number" [(ngModel)]="ragNegativeFeedbacksThreshold" min="1" max="10">
                    <mat-hint>Número de feedbacks negativos consecutivos antes de escalar (recomendado: 2)</mat-hint>
                  </mat-form-field>
                </div>

                <div class="actions">
                  <button mat-raised-button color="primary" (click)="saveRagConfig()" [disabled]="savingRag()">
                    <mat-icon>save</mat-icon>
                    {{ savingRag() ? 'Salvando...' : 'Salvar Configuração' }}
                  </button>
                  <button mat-raised-button (click)="resetRagConfig()" [disabled]="savingRag()">
                    <mat-icon>refresh</mat-icon>
                    Restaurar Padrão
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Integrações -->
        <mat-tab label="Integrações">
          <div class="tab-content">
            <h2>Integrações Externas</h2>
            <p class="description">
              Configure integrações com sistemas externos. Ambiente actual:
              <mat-chip [color]="currentEnvironment === 'prod' ? 'primary' : 'accent'">
                {{ currentEnvironment }}
              </mat-chip>
            </p>

            @if (loadingIntegrations()) {
              <div class="loading"><mat-spinner></mat-spinner></div>
            } @else {
              <mat-accordion>
                <!-- Ollama -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>psychology</mat-icon>
                      Ollama (LLM Local)
                    </mat-panel-title>
                    <mat-panel-description>
                      <mat-chip [color]="integrations['OLLAMA']?.enabled ? 'primary' : 'warn'" size="small">
                        {{ integrations['OLLAMA']?.enabled ? 'Activo' : 'Inactivo' }}
                      </mat-chip>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="integration-content">
                    <mat-slide-toggle
                      color="primary"
                      [(ngModel)]="ollamaEnabled"
                      (change)="onIntegrationToggle('OLLAMA')">
                      Activar Integração
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline" class="full-width mt-2">
                      <mat-label>URL Base</mat-label>
                      <input matInput [(ngModel)]="ollamaBaseUrl">
                      <mat-hint>Ex: http://localhost:11434</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Modelo de Chat</mat-label>
                      <input matInput [(ngModel)]="ollamaChatModel">
                      <mat-hint>Ex: qwen2.5:14b, llama3.1:8b</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Modelo de Embedding</mat-label>
                      <input matInput [(ngModel)]="ollamaEmbeddingModel">
                      <mat-hint>Ex: nomic-embed-text</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Timeout (ms)</mat-label>
                      <input matInput type="number" [(ngModel)]="ollamaTimeout">
                    </mat-form-field>

                    <div class="actions">
                      <button mat-raised-button color="primary" (click)="saveIntegration('OLLAMA')" [disabled]="savingIntegration()">
                        <mat-icon>save</mat-icon>
                        Salvar
                      </button>
                      <button mat-raised-button (click)="testConnection('OLLAMA')" [disabled]="testingConnection()">
                        <mat-icon>network_check</mat-icon>
                        Testar Conexão
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- ChromaDB -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>storage</mat-icon>
                      ChromaDB (Vector Store)
                    </mat-panel-title>
                    <mat-panel-description>
                      @if (!integrations['CHROMADB']?.available) {
                        <mat-chip color="warn" size="small">Apenas Produção</mat-chip>
                      } @else {
                        <mat-chip [color]="integrations['CHROMADB']?.enabled ? 'primary' : 'warn'" size="small">
                          {{ integrations['CHROMADB']?.enabled ? 'Activo' : 'Inactivo' }}
                        </mat-chip>
                      }
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="integration-content">
                    @if (!integrations['CHROMADB']?.available) {
                      <div class="env-warning">
                        <mat-icon>warning</mat-icon>
                        Esta integração só está disponível em ambiente de produção.
                      </div>
                    }

                    <mat-slide-toggle
                      color="primary"
                      [(ngModel)]="chromaEnabled"
                      [disabled]="!integrations['CHROMADB']?.available"
                      (change)="onIntegrationToggle('CHROMADB')">
                      Activar Integração
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline" class="full-width mt-2">
                      <mat-label>URL Base</mat-label>
                      <input matInput [(ngModel)]="chromaBaseUrl" [disabled]="!integrations['CHROMADB']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Collection</mat-label>
                      <input matInput [(ngModel)]="chromaCollection" [disabled]="!integrations['CHROMADB']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Tenant</mat-label>
                      <input matInput [(ngModel)]="chromaTenant" [disabled]="!integrations['CHROMADB']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Database</mat-label>
                      <input matInput [(ngModel)]="chromaDatabase" [disabled]="!integrations['CHROMADB']?.available">
                    </mat-form-field>

                    <div class="actions">
                      <button mat-raised-button color="primary" (click)="saveIntegration('CHROMADB')"
                              [disabled]="savingIntegration() || !integrations['CHROMADB']?.available">
                        <mat-icon>save</mat-icon>
                        Salvar
                      </button>
                      <button mat-raised-button (click)="testConnection('CHROMADB')"
                              [disabled]="testingConnection() || !integrations['CHROMADB']?.available">
                        <mat-icon>network_check</mat-icon>
                        Testar Conexão
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- Hazelcast -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>memory</mat-icon>
                      Hazelcast (Cache Distribuído)
                    </mat-panel-title>
                    <mat-panel-description>
                      @if (!integrations['HAZELCAST']?.available) {
                        <mat-chip color="warn" size="small">Apenas Produção</mat-chip>
                      } @else {
                        <mat-chip [color]="integrations['HAZELCAST']?.enabled ? 'primary' : 'warn'" size="small">
                          {{ integrations['HAZELCAST']?.enabled ? 'Activo' : 'Inactivo' }}
                        </mat-chip>
                      }
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="integration-content">
                    @if (!integrations['HAZELCAST']?.available) {
                      <div class="env-warning">
                        <mat-icon>warning</mat-icon>
                        Esta integração só está disponível em ambiente de produção.
                      </div>
                    }

                    <mat-slide-toggle
                      color="primary"
                      [(ngModel)]="hazelcastEnabled"
                      [disabled]="!integrations['HAZELCAST']?.available"
                      (change)="onIntegrationToggle('HAZELCAST')">
                      Activar Integração
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline" class="full-width mt-2">
                      <mat-label>Cluster Name</mat-label>
                      <input matInput [(ngModel)]="hazelcastClusterName" [disabled]="!integrations['HAZELCAST']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Instance Name</mat-label>
                      <input matInput [(ngModel)]="hazelcastInstanceName" [disabled]="!integrations['HAZELCAST']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Members (IP:Port separados por vírgula)</mat-label>
                      <input matInput [(ngModel)]="hazelcastMembers" [disabled]="!integrations['HAZELCAST']?.available">
                      <mat-hint>Ex: 192.168.1.10:5701,192.168.1.11:5701</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>TTL (segundos)</mat-label>
                      <input matInput type="number" [(ngModel)]="hazelcastTtl" [disabled]="!integrations['HAZELCAST']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Max Size (entries)</mat-label>
                      <input matInput type="number" [(ngModel)]="hazelcastMaxSize" [disabled]="!integrations['HAZELCAST']?.available">
                    </mat-form-field>

                    <div class="actions">
                      <button mat-raised-button color="primary" (click)="saveIntegration('HAZELCAST')"
                              [disabled]="savingIntegration() || !integrations['HAZELCAST']?.available">
                        <mat-icon>save</mat-icon>
                        Salvar
                      </button>
                      <button mat-raised-button (click)="testConnection('HAZELCAST')"
                              [disabled]="testingConnection() || !integrations['HAZELCAST']?.available">
                        <mat-icon>network_check</mat-icon>
                        Testar Conexão
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- GLPI -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>support_agent</mat-icon>
                      GLPI (Helpdesk)
                    </mat-panel-title>
                    <mat-panel-description>
                      @if (!integrations['GLPI']?.available) {
                        <mat-chip color="warn" size="small">Apenas Produção</mat-chip>
                      } @else {
                        <mat-chip [color]="integrations['GLPI']?.enabled ? 'primary' : 'warn'" size="small">
                          {{ integrations['GLPI']?.enabled ? 'Activo' : 'Inactivo' }}
                        </mat-chip>
                      }
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="integration-content">
                    @if (!integrations['GLPI']?.available) {
                      <div class="env-warning">
                        <mat-icon>warning</mat-icon>
                        Esta integração só está disponível em ambiente de produção.
                      </div>
                    }

                    <mat-slide-toggle
                      color="primary"
                      [(ngModel)]="glpiEnabled"
                      [disabled]="!integrations['GLPI']?.available"
                      (change)="onIntegrationToggle('GLPI')">
                      Activar Integração
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline" class="full-width mt-2">
                      <mat-label>URL Base</mat-label>
                      <input matInput [(ngModel)]="glpiBaseUrl" [disabled]="!integrations['GLPI']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>App Token</mat-label>
                      <input matInput type="password" [(ngModel)]="glpiAppToken" [disabled]="!integrations['GLPI']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>User Token</mat-label>
                      <input matInput type="password" [(ngModel)]="glpiUserToken" [disabled]="!integrations['GLPI']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Default Category ID</mat-label>
                      <input matInput type="number" [(ngModel)]="glpiDefaultCategory" [disabled]="!integrations['GLPI']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Default Entity ID</mat-label>
                      <input matInput type="number" [(ngModel)]="glpiDefaultEntity" [disabled]="!integrations['GLPI']?.available">
                    </mat-form-field>

                    <div class="actions">
                      <button mat-raised-button color="primary" (click)="saveIntegration('GLPI')"
                              [disabled]="savingIntegration() || !integrations['GLPI']?.available">
                        <mat-icon>save</mat-icon>
                        Salvar
                      </button>
                      <button mat-raised-button (click)="testConnection('GLPI')"
                              [disabled]="testingConnection() || !integrations['GLPI']?.available">
                        <mat-icon>network_check</mat-icon>
                        Testar Conexão
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>

                <!-- Security Framework -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>security</mat-icon>
                      Security Framework
                    </mat-panel-title>
                    <mat-panel-description>
                      @if (!integrations['SECURITY']?.available) {
                        <mat-chip color="warn" size="small">Apenas Produção</mat-chip>
                      } @else {
                        <mat-chip [color]="integrations['SECURITY']?.enabled ? 'primary' : 'warn'" size="small">
                          {{ integrations['SECURITY']?.enabled ? 'Activo' : 'Inactivo' }}
                        </mat-chip>
                      }
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="integration-content">
                    @if (!integrations['SECURITY']?.available) {
                      <div class="env-warning">
                        <mat-icon>warning</mat-icon>
                        Esta integração só está disponível em ambiente de produção.
                      </div>
                    }

                    <mat-slide-toggle
                      color="primary"
                      [(ngModel)]="securityEnabled"
                      [disabled]="!integrations['SECURITY']?.available"
                      (change)="onIntegrationToggle('SECURITY')">
                      Activar Integração
                    </mat-slide-toggle>

                    <mat-form-field appearance="outline" class="full-width mt-2">
                      <mat-label>JWT Secret</mat-label>
                      <input matInput type="password" [(ngModel)]="securityJwtSecret" [disabled]="!integrations['SECURITY']?.available">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>JWT Expiration (ms)</mat-label>
                      <input matInput type="number" [(ngModel)]="securityJwtExpiration" [disabled]="!integrations['SECURITY']?.available">
                      <mat-hint>86400000 = 24 horas</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>CORS Allowed Origins</mat-label>
                      <input matInput [(ngModel)]="securityCorsOrigins" [disabled]="!integrations['SECURITY']?.available">
                      <mat-hint>Ex: https://esistafe.gov.mz,https://admin.esistafe.gov.mz</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Session Timeout (segundos)</mat-label>
                      <input matInput type="number" [(ngModel)]="securitySessionTimeout" [disabled]="!integrations['SECURITY']?.available">
                    </mat-form-field>

                    <div class="actions">
                      <button mat-raised-button color="primary" (click)="saveIntegration('SECURITY')"
                              [disabled]="savingIntegration() || !integrations['SECURITY']?.available">
                        <mat-icon>save</mat-icon>
                        Salvar
                      </button>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>

              <div class="actions mt-2">
                <button mat-raised-button (click)="initializeDefaults()">
                  <mat-icon>settings_backup_restore</mat-icon>
                  Inicializar Configurações Padrão
                </button>
              </div>
            }
          </div>
        </mat-tab>

        <!-- Tab: Notificações -->
        <mat-tab label="Notificações">
          <div class="tab-content">
            <h2>Configurações de Notificações</h2>
            <p class="description">Configure quando e como receber notificações.</p>

            <mat-divider></mat-divider>

            <div class="settings-section">
              <h3>Alertas</h3>

              <div class="toggle-item">
                <div>
                  <strong>Novos Incidentes</strong>
                  <p>Notificar quando novos incidentes forem criados</p>
                </div>
                <mat-slide-toggle color="primary" [checked]="true"></mat-slide-toggle>
              </div>

              <div class="toggle-item">
                <div>
                  <strong>SLA em Risco</strong>
                  <p>Alertar quando SLA estiver próximo de vencer</p>
                </div>
                <mat-slide-toggle color="primary" [checked]="true"></mat-slide-toggle>
              </div>

              <div class="toggle-item">
                <div>
                  <strong>Escalações</strong>
                  <p>Notificar conversas escaladas para suporte</p>
                </div>
                <mat-slide-toggle color="primary" [checked]="true"></mat-slide-toggle>
              </div>

              <div class="toggle-item">
                <div>
                  <strong>Baixa Satisfação</strong>
                  <p>Alertar quando satisfação estiver abaixo de 60%</p>
                </div>
                <mat-slide-toggle color="primary"></mat-slide-toggle>
              </div>
            </div>

            <div class="actions">
              <button mat-raised-button color="primary">
                <mat-icon>save</mat-icon>
                Salvar Preferências
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-card>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 28px; font-weight: 500; }
      .subtitle { color: rgba(0, 0, 0, 0.54); font-size: 14px; }
    }
    .tab-content {
      padding: 24px;
      h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 500; }
      .description { color: rgba(0, 0, 0, 0.54); margin-bottom: 24px; }
      h3 { margin: 24px 0 16px 0; font-size: 16px; font-weight: 500; }
    }
    .prompt-editor, .settings-section { margin: 24px 0; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .full-width { width: 100%; }
    .mt-2 { margin-top: 16px; }
    .info-box {
      display: flex; gap: 12px; padding: 16px;
      background: #e3f2fd; border-radius: 8px; margin-top: 16px;
      mat-icon { color: #1976d2; }
      p { margin: 4px 0 0 0; font-size: 12px; color: rgba(0, 0, 0, 0.54); }
    }
    .toggle-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      &:last-child { border-bottom: none; }
      p { margin: 4px 0 0 0; font-size: 13px; color: rgba(0, 0, 0, 0.54); }
    }
    mat-divider { margin: 24px 0; }
    mat-expansion-panel-header mat-icon { margin-right: 12px; }
    .integration-content { padding: 16px 0; }
    .env-warning {
      display: flex; align-items: center; gap: 8px;
      padding: 12px; background: #fff3e0; border-radius: 4px;
      color: #e65100; margin-bottom: 16px;
    }
    mat-accordion { margin-top: 24px; }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  // System Prompts
  selectedModule: string | null = 'SUPORTE';
  promptName = '';
  promptContent = '';
  promptVersion = '1.0';
  promptId: number | null = null;
  loading = signal(false);
  saving = signal(false);

  // RAG Module Configs
  selectedRagModule: string | null = 'SUPORTE';
  ragTopK = 10;
  ragSimilarityThreshold = 0.30;
  ragEscalationThreshold = 0.65;
  ragTemperature = 0.2;
  ragMaxTokens = 2048;
  ragModel = 'llama3.1:8b';
  ragEscalationKeywords = '';
  ragUncertainResponsePhrases = '';
  ragNegativeFeedbacksThreshold = 2;
  ragConfigId: number | null = null;
  loadingRag = signal(false);
  savingRag = signal(false);

  // Integrations
  integrations: Record<string, IntegrationConfig | undefined> = {};
  currentEnvironment = 'dev';
  loadingIntegrations = signal(false);
  savingIntegration = signal(false);
  testingConnection = signal(false);

  // Ollama
  ollamaEnabled = true;
  ollamaBaseUrl = 'http://localhost:11434';
  ollamaChatModel = 'qwen2.5:14b';
  ollamaEmbeddingModel = 'nomic-embed-text';
  ollamaTimeout = 120000;

  // ChromaDB
  chromaEnabled = false;
  chromaBaseUrl = 'http://localhost:8000';
  chromaCollection = 'esistafe_docs';
  chromaTenant = 'default_tenant';
  chromaDatabase = 'default_database';

  // Hazelcast
  hazelcastEnabled = false;
  hazelcastClusterName = 'chatbot-cluster';
  hazelcastInstanceName = 'chatbot-instance';
  hazelcastMembers = '127.0.0.1:5701';
  hazelcastTtl = 3600;
  hazelcastMaxSize = 10000;

  // GLPI
  glpiEnabled = true;
  glpiBaseUrl = 'http://localhost:9080/apirest.php';
  glpiAppToken = '';
  glpiUserToken = '';
  glpiDefaultCategory = 1;
  glpiDefaultEntity = 0;

  // Security
  securityEnabled = true;
  securityJwtSecret = '';
  securityJwtExpiration = 86400000;
  securityCorsOrigins = '*';
  securitySessionTimeout = 3600;

  ngOnInit() {
    if (this.selectedModule) this.loadPrompt();
    if (this.selectedRagModule) this.loadRagConfig();
    this.loadIntegrations();
  }

  // ========== Prompts ==========
  loadPrompt() {
    if (!this.selectedModule) return;
    this.loading.set(true);
    this.api.getPromptByModule(this.selectedModule as any).subscribe({
      next: (prompt) => {
        this.promptId = prompt.id;
        this.promptName = prompt.name;
        this.promptContent = prompt.content;
        this.promptVersion = prompt.version;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  savePrompt() {
    if (!this.selectedModule || !this.promptContent) {
      this.snackBar.open('Preencha todos os campos', 'Fechar', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.api.savePrompt(this.selectedModule as any, {
      name: this.promptName,
      content: this.promptContent,
      version: this.promptVersion
    }).subscribe({
      next: () => {
        this.snackBar.open('Prompt salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.saving.set(false);
        this.loadPrompt();
      },
      error: () => {
        this.snackBar.open('Erro ao salvar prompt', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  resetPrompt() {
    if (!this.selectedModule) return;
    if (!confirm('Restaurar prompt padrão?')) return;
    this.saving.set(true);
    this.api.resetPromptToDefault(this.selectedModule as any).subscribe({
      next: () => {
        this.snackBar.open('Prompt restaurado!', 'Fechar', { duration: 3000 });
        this.saving.set(false);
        this.loadPrompt();
      },
      error: () => this.saving.set(false)
    });
  }

  // ========== RAG Config ==========
  loadRagConfig() {
    if (!this.selectedRagModule) return;
    this.loadingRag.set(true);
    this.api.getModuleConfig(this.selectedRagModule as any).subscribe({
      next: (config) => {
        this.ragConfigId = config.id;
        this.ragTopK = config.topK;
        this.ragSimilarityThreshold = config.similarityThreshold;
        this.ragEscalationThreshold = config.escalationThreshold;
        this.ragTemperature = config.temperature;
        this.ragMaxTokens = config.maxTokens;
        this.ragModel = config.llmModel;
        this.ragEscalationKeywords = config.escalationKeywords || '';
        this.ragUncertainResponsePhrases = config.uncertainResponsePhrases || '';
        this.ragNegativeFeedbacksThreshold = config.negativeFeedbacksThreshold || 2;
        this.loadingRag.set(false);
      },
      error: () => this.loadingRag.set(false)
    });
  }

  saveRagConfig() {
    if (!this.selectedRagModule) return;
    this.savingRag.set(true);
    this.api.saveModuleConfig(this.selectedRagModule as any, {
      llmModel: this.ragModel,
      topK: this.ragTopK,
      similarityThreshold: this.ragSimilarityThreshold,
      escalationThreshold: this.ragEscalationThreshold,
      temperature: this.ragTemperature,
      maxTokens: this.ragMaxTokens,
      escalationKeywords: this.ragEscalationKeywords,
      uncertainResponsePhrases: this.ragUncertainResponsePhrases,
      negativeFeedbacksThreshold: this.ragNegativeFeedbacksThreshold
    }).subscribe({
      next: () => {
        this.snackBar.open('Configuração RAG salva!', 'Fechar', { duration: 3000 });
        this.savingRag.set(false);
        this.loadRagConfig();
      },
      error: () => {
        this.snackBar.open('Erro ao salvar configuração', 'Fechar', { duration: 3000 });
        this.savingRag.set(false);
      }
    });
  }

  resetRagConfig() {
    if (!this.selectedRagModule) return;
    if (!confirm('Restaurar configurações padrão?')) return;
    this.savingRag.set(true);
    this.api.resetModuleConfigToDefault(this.selectedRagModule as any).subscribe({
      next: () => {
        this.snackBar.open('Configuração restaurada!', 'Fechar', { duration: 3000 });
        this.savingRag.set(false);
        this.loadRagConfig();
      },
      error: () => this.savingRag.set(false)
    });
  }

  // ========== Integrations ==========
  loadIntegrations() {
    this.loadingIntegrations.set(true);
    this.api.getAllIntegrations().subscribe({
      next: (data) => {
        this.integrations = data;
        this.currentEnvironment = data['OLLAMA']?.environment || 'dev';
        this.populateIntegrationFields(data);
        this.loadingIntegrations.set(false);
      },
      error: () => {
        this.loadingIntegrations.set(false);
        this.snackBar.open('Erro ao carregar integrações', 'Fechar', { duration: 3000 });
      }
    });
  }

  populateIntegrationFields(data: Record<string, IntegrationConfig>) {
    // Ollama
    if (data['OLLAMA']) {
      this.ollamaEnabled = data['OLLAMA'].enabled;
      this.ollamaBaseUrl = data['OLLAMA'].configs['baseUrl'] || this.ollamaBaseUrl;
      this.ollamaChatModel = data['OLLAMA'].configs['chatModel'] || this.ollamaChatModel;
      this.ollamaEmbeddingModel = data['OLLAMA'].configs['embeddingModel'] || this.ollamaEmbeddingModel;
      this.ollamaTimeout = parseInt(data['OLLAMA'].configs['timeout'] || '120000');
    }
    // ChromaDB
    if (data['CHROMADB']) {
      this.chromaEnabled = data['CHROMADB'].enabled;
      this.chromaBaseUrl = data['CHROMADB'].configs['baseUrl'] || this.chromaBaseUrl;
      this.chromaCollection = data['CHROMADB'].configs['collection'] || this.chromaCollection;
      this.chromaTenant = data['CHROMADB'].configs['tenant'] || this.chromaTenant;
      this.chromaDatabase = data['CHROMADB'].configs['database'] || this.chromaDatabase;
    }
    // Hazelcast
    if (data['HAZELCAST']) {
      this.hazelcastEnabled = data['HAZELCAST'].enabled;
      this.hazelcastClusterName = data['HAZELCAST'].configs['clusterName'] || this.hazelcastClusterName;
      this.hazelcastInstanceName = data['HAZELCAST'].configs['instanceName'] || this.hazelcastInstanceName;
      this.hazelcastMembers = data['HAZELCAST'].configs['members'] || this.hazelcastMembers;
      this.hazelcastTtl = parseInt(data['HAZELCAST'].configs['ttlSeconds'] || '3600');
      this.hazelcastMaxSize = parseInt(data['HAZELCAST'].configs['maxSize'] || '10000');
    }
    // GLPI
    if (data['GLPI']) {
      this.glpiEnabled = data['GLPI'].enabled;
      this.glpiBaseUrl = data['GLPI'].configs['baseUrl'] || this.glpiBaseUrl;
      this.glpiAppToken = data['GLPI'].configs['appToken'] || '';
      this.glpiUserToken = data['GLPI'].configs['userToken'] || '';
      this.glpiDefaultCategory = parseInt(data['GLPI'].configs['defaultCategory'] || '1');
      this.glpiDefaultEntity = parseInt(data['GLPI'].configs['defaultEntity'] || '0');
    }
    // Security
    if (data['SECURITY']) {
      this.securityEnabled = data['SECURITY'].enabled;
      this.securityJwtSecret = data['SECURITY'].configs['jwtSecret'] || '';
      this.securityJwtExpiration = parseInt(data['SECURITY'].configs['jwtExpirationMs'] || '86400000');
      this.securityCorsOrigins = data['SECURITY'].configs['corsAllowedOrigins'] || '*';
      this.securitySessionTimeout = parseInt(data['SECURITY'].configs['sessionTimeout'] || '3600');
    }
  }

  onIntegrationToggle(type: string) {
    // Just triggers UI update
  }

  saveIntegration(type: string) {
    this.savingIntegration.set(true);
    const configs = this.getIntegrationConfigs(type);

    this.api.saveIntegration(type, configs).subscribe({
      next: () => {
        this.snackBar.open(`Integração ${type} salva com sucesso!`, 'Fechar', { duration: 3000 });
        this.savingIntegration.set(false);
        this.loadIntegrations();
      },
      error: () => {
        this.snackBar.open('Erro ao salvar integração', 'Fechar', { duration: 3000 });
        this.savingIntegration.set(false);
      }
    });
  }

  getIntegrationConfigs(type: string): { enabled: boolean; configs: Record<string, string> } {
    switch (type) {
      case 'OLLAMA':
        return {
          enabled: this.ollamaEnabled,
          configs: {
            baseUrl: this.ollamaBaseUrl,
            chatModel: this.ollamaChatModel,
            embeddingModel: this.ollamaEmbeddingModel,
            timeout: this.ollamaTimeout.toString()
          }
        };
      case 'CHROMADB':
        return {
          enabled: this.chromaEnabled,
          configs: {
            baseUrl: this.chromaBaseUrl,
            collection: this.chromaCollection,
            tenant: this.chromaTenant,
            database: this.chromaDatabase
          }
        };
      case 'HAZELCAST':
        return {
          enabled: this.hazelcastEnabled,
          configs: {
            clusterName: this.hazelcastClusterName,
            instanceName: this.hazelcastInstanceName,
            members: this.hazelcastMembers,
            ttlSeconds: this.hazelcastTtl.toString(),
            maxSize: this.hazelcastMaxSize.toString()
          }
        };
      case 'GLPI':
        return {
          enabled: this.glpiEnabled,
          configs: {
            baseUrl: this.glpiBaseUrl,
            appToken: this.glpiAppToken,
            userToken: this.glpiUserToken,
            defaultCategory: this.glpiDefaultCategory.toString(),
            defaultEntity: this.glpiDefaultEntity.toString()
          }
        };
      case 'SECURITY':
        return {
          enabled: this.securityEnabled,
          configs: {
            jwtSecret: this.securityJwtSecret,
            jwtExpirationMs: this.securityJwtExpiration.toString(),
            corsAllowedOrigins: this.securityCorsOrigins,
            sessionTimeout: this.securitySessionTimeout.toString()
          }
        };
      default:
        return { enabled: false, configs: {} };
    }
  }

  testConnection(type: string) {
    this.testingConnection.set(true);
    this.api.testIntegrationConnection(type).subscribe({
      next: (result) => {
        if (result.success) {
          this.snackBar.open(`Conexão OK: ${result.message}`, 'Fechar', { duration: 5000 });
        } else {
          this.snackBar.open(`Falha: ${result.message}`, 'Fechar', { duration: 5000 });
        }
        this.testingConnection.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao testar conexão', 'Fechar', { duration: 3000 });
        this.testingConnection.set(false);
      }
    });
  }

  initializeDefaults() {
    if (!confirm('Inicializar todas as configurações de integração com valores padrão?')) return;

    this.api.initializeIntegrationDefaults().subscribe({
      next: () => {
        this.snackBar.open('Configurações padrão inicializadas!', 'Fechar', { duration: 3000 });
        this.loadIntegrations();
      },
      error: () => {
        this.snackBar.open('Erro ao inicializar configurações', 'Fechar', { duration: 3000 });
      }
    });
  }
}
