import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';

// Activate only report/read pages; clinical actions remain dormant.
export const hemoAdmissionPilotRoutes: Routes = [
  {
    path: 'admission/stats',
    canActivate: [authGuardGuard],
    loadComponent: () => import('../../features/admission/admission-stats.component').then(m => m.AdmissionStatsComponent)
  },
  {path:'admission/list',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-list.component').then(m=>m.AdmissionListComponent)},
  {path:'admission/his',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-his.component').then(m=>m.AdmissionHisComponent)}
];
