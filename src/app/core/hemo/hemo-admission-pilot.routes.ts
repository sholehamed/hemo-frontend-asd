import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';

// Only the aggregate report pilot is active until company login, menu hierarchy
// and the remaining route/role contracts have been verified.
export const hemoAdmissionPilotRoutes: Routes = [
  {
    path: 'admission/stats',
    canActivate: [authGuardGuard],
    loadComponent: () => import('../../features/admission/admission-stats.component').then(m => m.AdmissionStatsComponent)
  }
];
