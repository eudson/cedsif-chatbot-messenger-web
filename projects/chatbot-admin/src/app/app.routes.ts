import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component')
      .then(m => m.LoginComponent),
    title: 'Login - CEDSIF Chatbot'
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        title: 'Dashboard - CEDSIF Chatbot'
      },
  {
    path: 'conversations',
    loadComponent: () => import('./features/conversations/conversations.component')
      .then(m => m.ConversationsComponent),
    title: 'Conversas - CEDSIF Chatbot'
  },
  {
    path: 'knowledge-base',
    loadComponent: () => import('./features/knowledge-base/knowledge-base.component')
      .then(m => m.KnowledgeBaseComponent),
    title: 'Base de Conhecimento - CEDSIF Chatbot'
  },
  {
    path: 'incidents',
    loadComponent: () => import('./features/incidents/incidents.component')
      .then(m => m.IncidentsComponent),
    title: 'Incidentes - CEDSIF Chatbot'
  },
  {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component')
          .then(m => m.SettingsComponent),
        title: 'Configurações - CEDSIF Chatbot'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
