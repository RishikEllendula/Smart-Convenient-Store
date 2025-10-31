import { Routes } from '@angular/router';
import { ownerGuard } from './guards/owner.guard';

export const routes: Routes = [
  // Home as default route
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },

  // App pages
  { path: 'browse', loadComponent: () => import('./pages/customer-browse/customer-browse.component').then(m => m.CustomerBrowseComponent) },
  { path: 'compare', loadComponent: () => import('./pages/compare/compare.component').then(m => m.CompareComponent) },
  { path: 'owner', canActivate: [ownerGuard], loadComponent: () => import('./pages/owner-dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent) },
  { path: 'login', loadComponent: () => import('./pages/login-register/login-register.component').then(m => m.LoginRegisterComponent) },

  // Fallback
  { path: '**', redirectTo: '' }
];
