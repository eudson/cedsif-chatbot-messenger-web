import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTabsModule, MatTableModule,
    MatPaginatorModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>Incidentes GLPI</h1>
    </div>

    <mat-card>
      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Pendentes">
          <ng-container *ngTemplateOutlet="incidentTable; context: {data: pending()}"></ng-container>
        </mat-tab>
        <mat-tab label="Tratados">
          <ng-container *ngTemplateOutlet="incidentTable; context: {data: resolved()}"></ng-container>
        </mat-tab>
      </mat-tab-group>
    </mat-card>

    <ng-template #incidentTable let-data="data">
      @if (loading()) {
        <div class="loading"><mat-spinner></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="data" class="full-width">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let row">#{{row.glpiTicketId}}</td>
          </ng-container>
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let row">{{row.title}}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row"><mat-chip>{{row.status}}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Prioridade</th>
            <td mat-cell *matCellDef="let row" [class]="'priority-' + row.priority">{{row.priority}}</td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Criado</th>
            <td mat-cell *matCellDef="let row">{{row.createdAt | date:'dd/MM/yyyy'}}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
        <mat-paginator [length]="totalElements()" [pageSize]="20" (page)="onPageChange($event)"></mat-paginator>
      }
    </ng-template>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; h1 { margin: 0; font-size: 28px; } }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .priority-BAIXA { color: #4caf50; }
    .priority-MEDIA { color: #ff9800; }
    .priority-ALTA { color: #f44336; }
  `]
})
export class IncidentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  pending = signal<any[]>([]);
  resolved = signal<any[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  currentTab = 0;
  cols = ['id', 'title', 'status', 'priority', 'created'];

  ngOnInit() { this.loadPending(); }

  loadPending() {
    this.loading.set(true);
    this.api.getPendingIncidents().subscribe({
      next: (p) => { this.pending.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadResolved() {
    this.loading.set(true);
    this.api.getResolvedIncidents().subscribe({
      next: (p) => { this.resolved.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onTabChange(index: number) {
    this.currentTab = index;
    index === 0 ? this.loadPending() : this.loadResolved();
  }

  onPageChange(event: PageEvent) {
    this.currentTab === 0 ? this.loadPending() : this.loadResolved();
  }
}
