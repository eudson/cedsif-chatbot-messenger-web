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
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule
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
              Cada módulo pode ter um prompt personalizado para melhor contextualização das respostas.
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
                  <textarea
                    matInput
                    [(ngModel)]="promptContent"
                    rows="15"
                    placeholder="Instruções para o modelo de IA...">
                  </textarea>
                  <mat-hint>Instruções que o modelo seguirá ao responder perguntas deste módulo</mat-hint>
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

                @if (promptId) {
                  <div class="info-box">
                    <mat-icon>info</mat-icon>
                    <div>
                      <strong>Prompt Ativo</strong>
                      <p>ID: {{promptId}} | Versão: {{promptVersion}}</p>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Configurações RAG -->
        <mat-tab label="Configurações RAG">
          <div class="tab-content">
            <h2>Configuração RAG e LLM por Módulo</h2>
            <p class="description">
              Configure os parâmetros de Retrieval-Augmented Generation (RAG) e do modelo de linguagem para cada módulo.
              <strong>Atenção:</strong> Valores incorretos podem causar alucinações ou respostas imprecisas.
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
                  <h3>🔍 Parâmetros de Busca (RAG)</h3>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Top-K (Documentos Recuperados)</mat-label>
                    <input matInput type="number" [(ngModel)]="ragTopK" min="1" max="20">
                    <mat-hint>Número de chunks similares a recuperar (recomendado: 10)</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Similarity Threshold</mat-label>
                    <input matInput type="number" [(ngModel)]="ragSimilarityThreshold" step="0.05" min="0" max="1">
                    <mat-hint>⚠️ Limiar de similaridade para incluir documentos (0.30 = mais permissivo, 0.70 = muito restritivo)</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Escalation Threshold</mat-label>
                    <input matInput type="number" [(ngModel)]="ragEscalationThreshold" step="0.05" min="0" max="1">
                    <mat-hint>Quando escalar para GLPI por baixa confiança (recomendado: 0.65)</mat-hint>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="settings-section">
                  <h3>🤖 Parâmetros do Modelo LLM</h3>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Modelo LLM</mat-label>
                    <input matInput [(ngModel)]="ragModel">
                    <mat-hint>Modelo Ollama a usar (ex: llama3.1:8b)</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Temperature</mat-label>
                    <input matInput type="number" [(ngModel)]="ragTemperature" step="0.1" min="0" max="2">
                    <mat-hint>⚠️ Controla criatividade vs precisão (0.2 = preciso, 0.7 = criativo/alucinações)</mat-hint>
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
                  <h3>🚨 Configurações de Escalação Automática</h3>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Frases de Resposta Incerta</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="ragUncertainResponsePhrases"
                      rows="4"
                      placeholder="não tenho informação,não encontrei,não possuo dados">
                    </textarea>
                    <mat-hint>Frases que indicam que o LLM não conseguiu responder (separadas por vírgula). Disparam escalação automática.</mat-hint>
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
                    Restaurar Padrão Otimizado
                  </button>
                </div>

                @if (ragConfigId) {
                  <div class="info-box">
                    <mat-icon>info</mat-icon>
                    <div>
                      <strong>Configuração Atual</strong>
                      <p>TopK: {{ragTopK}} | Threshold: {{ragSimilarityThreshold}} | Temp: {{ragTemperature}}</p>
                      <p style="font-size: 11px; margin-top: 8px;">
                        💡 <strong>Dica:</strong> Se o modelo estiver "inventando" respostas, reduza Temperature para 0.2 e Threshold para 0.30
                      </p>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Geral -->
        <mat-tab label="Geral">
          <div class="tab-content">
            <h2>Configurações Gerais</h2>
            <p class="description">Configurações globais do sistema de chatbot.</p>

            <mat-divider></mat-divider>

            <div class="settings-section">
              <h3>Sessões</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tempo de Vida (horas)</mat-label>
                <input matInput type="number" value="24" min="1" max="168">
                <mat-hint>Duração das sessões de conversa</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Máximo de Mensagens por Sessão</mat-label>
                <input matInput type="number" value="100" min="10" max="500">
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-raised-button color="primary">
                <mat-icon>save</mat-icon>
                Salvar Configurações
              </button>
              <button mat-raised-button>
                <mat-icon>refresh</mat-icon>
                Restaurar Padrões
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Integrações -->
        <mat-tab label="Integrações">
          <div class="tab-content">
            <h2>Integrações Externas</h2>
            <p class="description">Configure integrações com sistemas externos.</p>

            <mat-divider></mat-divider>

            <div class="settings-section">
              <h3>GLPI (Helpdesk)</h3>

              <mat-slide-toggle color="primary">Ativado</mat-slide-toggle>

              <mat-form-field appearance="outline" class="full-width mt-2">
                <mat-label>URL Base</mat-label>
                <input matInput value="http://localhost:9080/apirest.php">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>App Token</mat-label>
                <input matInput type="password" placeholder="••••••••">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>User Token</mat-label>
                <input matInput type="password" placeholder="••••••••">
              </mat-form-field>
            </div>

            <mat-divider></mat-divider>

            <div class="settings-section">
              <h3>Ollama (LLM Local)</h3>

              <mat-slide-toggle color="primary" [checked]="true">Ativado</mat-slide-toggle>

              <mat-form-field appearance="outline" class="full-width mt-2">
                <mat-label>URL Base</mat-label>
                <input matInput value="http://localhost:11434">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Modelo de Chat</mat-label>
                <input matInput value="llama3.1:8b">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Modelo de Embedding</mat-label>
                <input matInput value="nomic-embed-text">
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-raised-button color="primary">
                <mat-icon>save</mat-icon>
                Salvar Integrações
              </button>
              <button mat-raised-button>
                <mat-icon>network_check</mat-icon>
                Testar Conexões
              </button>
            </div>
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

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      .subtitle {
        color: rgba(0, 0, 0, 0.54);
        font-size: 14px;
      }
    }

    .tab-content {
      padding: 24px;

      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 500;
      }

      .description {
        color: rgba(0, 0, 0, 0.54);
        margin-bottom: 24px;
      }

      h3 {
        margin: 24px 0 16px 0;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .prompt-editor {
      margin-top: 24px;
    }

    .settings-section {
      margin: 24px 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
    }

    .mt-2 {
      margin-top: 16px;
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-top: 16px;

      mat-icon {
        color: #1976d2;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
      }
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);

      &:last-child {
        border-bottom: none;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: rgba(0, 0, 0, 0.54);
      }
    }

    mat-divider {
      margin: 24px 0;
    }
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

  ngOnInit() {
    if (this.selectedModule) {
      this.loadPrompt();
    }
    if (this.selectedRagModule) {
      this.loadRagConfig();
    }
  }

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
      error: (err) => {
        console.error('Erro ao carregar prompt:', err);
        this.loading.set(false);
      }
    });
  }

  savePrompt() {
    if (!this.selectedModule || !this.promptContent) {
      this.snackBar.open('Preencha todos os campos', 'Fechar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const data = {
      name: this.promptName,
      content: this.promptContent,
      version: this.promptVersion
    };

    this.api.savePrompt(this.selectedModule as any, data).subscribe({
      next: () => {
        this.snackBar.open('Prompt salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.saving.set(false);
        this.loadPrompt();
      },
      error: (err) => {
        console.error('Erro ao salvar prompt:', err);
        this.snackBar.open('Erro ao salvar prompt', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  resetPrompt() {
    if (!this.selectedModule) return;

    if (!confirm('Tem certeza que deseja restaurar o prompt padrão? Esta ação não pode ser desfeita.')) {
      return;
    }

    this.saving.set(true);
    this.api.resetPromptToDefault(this.selectedModule as any).subscribe({
      next: () => {
        this.snackBar.open('Prompt restaurado ao padrão!', 'Fechar', { duration: 3000 });
        this.saving.set(false);
        this.loadPrompt();
      },
      error: (err) => {
        console.error('Erro ao restaurar prompt:', err);
        this.snackBar.open('Erro ao restaurar prompt', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

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
      error: (err) => {
        console.error('Erro ao carregar config RAG:', err);
        this.loadingRag.set(false);
      }
    });
  }

  saveRagConfig() {
    if (!this.selectedRagModule) {
      this.snackBar.open('Selecione um módulo', 'Fechar', { duration: 3000 });
      return;
    }

    this.savingRag.set(true);
    const data = {
      llmModel: this.ragModel,
      topK: this.ragTopK,
      similarityThreshold: this.ragSimilarityThreshold,
      escalationThreshold: this.ragEscalationThreshold,
      temperature: this.ragTemperature,
      maxTokens: this.ragMaxTokens,
      escalationKeywords: this.ragEscalationKeywords,
      uncertainResponsePhrases: this.ragUncertainResponsePhrases,
      negativeFeedbacksThreshold: this.ragNegativeFeedbacksThreshold
    };

    this.api.saveModuleConfig(this.selectedRagModule as any, data).subscribe({
      next: () => {
        this.snackBar.open('✅ Configuração RAG salva! Faça uma nova pergunta para testar.', 'Fechar', { duration: 5000 });
        this.savingRag.set(false);
        this.loadRagConfig();
      },
      error: (err) => {
        console.error('Erro ao salvar config RAG:', err);
        this.snackBar.open('Erro ao salvar configuração', 'Fechar', { duration: 3000 });
        this.savingRag.set(false);
      }
    });
  }

  resetRagConfig() {
    if (!this.selectedRagModule) return;

    if (!confirm('Restaurar configurações RAG padrão otimizadas? (TopK=10, Threshold=0.30, Temperature=0.2)')) {
      return;
    }

    this.savingRag.set(true);
    this.api.resetModuleConfigToDefault(this.selectedRagModule as any).subscribe({
      next: () => {
        this.snackBar.open('✅ Configuração RAG restaurada! Teste agora.', 'Fechar', { duration: 5000 });
        this.savingRag.set(false);
        this.loadRagConfig();
      },
      error: (err) => {
        console.error('Erro ao restaurar config RAG:', err);
        this.snackBar.open('Erro ao restaurar configuração', 'Fechar', { duration: 3000 });
        this.savingRag.set(false);
      }
    });
  }

}
