import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';

// Company guard and exact seeded page patterns for connected admission pages.
export const hemoAdmissionPilotRoutes: Routes = [
  {
    path: 'admission/stats',
    canActivate: [authGuardGuard],
    loadComponent: () => import('../../features/admission/admission-stats.component').then(m => m.AdmissionStatsComponent)
  },
  {path:'admission/list',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-list.component').then(m=>m.AdmissionListComponent)},
  {path:'admission/his',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-his.component').then(m=>m.AdmissionHisComponent)},
  {path:'admission/new',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-create.component').then(m=>m.AdmissionCreateComponent)},
  {path:'admission/detail/:guid',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/admission/admission-detail.component').then(m=>m.AdmissionDetailComponent)},
  {path:'admission/identity',canActivate:[authGuardGuard],data:{kind:'Identity'},loadComponent:()=>import('../../features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)},
  {path:'admission/history',canActivate:[authGuardGuard],data:{kind:'History'},loadComponent:()=>import('../../features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)},
  {path:'admission/discharge',canActivate:[authGuardGuard],data:{kind:'Clearance'},loadComponent:()=>import('../../features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)}
];
