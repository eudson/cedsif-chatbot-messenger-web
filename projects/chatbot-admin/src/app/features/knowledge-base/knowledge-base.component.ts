import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { DocumentSummary, ModuleType, CollectionStats } from '../../core/models/api.models';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  documents = signal<DocumentSummary[]>([]);
  collections: CollectionStats[] = [];
  isLoading = signal(false);
  selectedModule: ModuleType = 'SUPORTE';

  // Paginação
  totalElements = signal(0);
  pageSize = signal(20);
  currentPage = signal(0);

  modules: ModuleType[] = ['DESPESA', 'RECEITA', 'CUT', 'TRIBUTACAO', 'SUPORTE', 'DEV'];

  displayedColumns = ['fileName', 'module', 'active', 'chunkCount', 'fileSize', 'lastIndexedAt', 'actions'];

  ngOnInit(): void {
    this.loadDocuments();
    this.loadCollectionStats();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.api.getDocuments(this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.documents.set(page.content);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar documentos:', err);
        this.snackBar.open('Erro ao carregar documentos', 'Fechar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadDocuments();
  }

  loadCollectionStats(): void {
    this.api.getCollectionStats().subscribe({
      next: (stats) => {
        this.collections = stats;
      },
      error: (err) => {
        console.error('Erro ao carregar estatísticas:', err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.uploadFile(file);

    // Reset input para permitir upload do mesmo ficheiro novamente
    input.value = '';
  }

  uploadFile(file: File): void {
    if (!this.selectedModule) {
      this.snackBar.open('Por favor, seleccione um módulo', 'Fechar', { duration: 3000 });
      return;
    }

    const validExtensions = ['pdf', 'docx', 'txt', 'xlsx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      this.snackBar.open('Formato não suportado. Use PDF, DOCX, TXT ou XLSX', 'Fechar', { duration: 4000 });
      return;
    }

    this.isLoading.set(true);
    this.api.uploadDocument(file, this.selectedModule).subscribe({
      next: (doc) => {
        this.snackBar.open(`Documento "${doc.fileName}" indexado com sucesso!`, 'Fechar', { duration: 3000 });
        this.loadDocuments();
        this.loadCollectionStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao fazer upload:', err);
        this.snackBar.open('Erro ao fazer upload do documento', 'Fechar', { duration: 4000 });
        this.isLoading.set(false);
      }
    });
  }

  deleteDocument(doc: DocumentSummary): void {
    if (!confirm(`Deseja desactivar o documento "${doc.fileName}"? Os chunks serão removidos do vector store.`)) {
      return;
    }

    this.api.deleteDocument(doc.id).subscribe({
      next: () => {
        this.snackBar.open('Documento desactivado com sucesso', 'Fechar', { duration: 2000 });
        this.loadDocuments();
        this.loadCollectionStats();
      },
      error: (err) => {
        console.error('Erro ao desactivar documento:', err);
        this.snackBar.open('Erro ao desactivar documento', 'Fechar', { duration: 3000 });
      }
    });
  }

  activateDocument(doc: DocumentSummary): void {
    if (!confirm(`Deseja activar o documento "${doc.fileName}"? O documento será re-indexado.`)) {
      return;
    }

    this.api.activateDocument(doc.id).subscribe({
      next: () => {
        this.snackBar.open('Documento activado e re-indexado com sucesso', 'Fechar', { duration: 2000 });
        this.loadDocuments();
        this.loadCollectionStats();
      },
      error: (err) => {
        console.error('Erro ao activar documento:', err);
        this.snackBar.open('Erro ao activar documento', 'Fechar', { duration: 3000 });
      }
    });
  }

  reindexAll(): void {
    if (!confirm('Deseja re-indexar todos os documentos? Esta operação pode demorar.')) {
      return;
    }

    this.isLoading.set(true);
    this.api.reindexDocuments().subscribe({
      next: (result) => {
        this.snackBar.open(`${result.documentsProcessed} documentos re-indexados`, 'Fechar', { duration: 3000 });
        this.loadDocuments();
        this.loadCollectionStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao re-indexar:', err);
        this.snackBar.open('Erro ao re-indexar documentos', 'Fechar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('pt-MZ');
  }
}
