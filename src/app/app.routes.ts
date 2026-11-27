import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
export const routes:Routes=[
 {path:'login',loadComponent:()=>import('./features/login/login.component').then(m=>m.LoginComponent)},
 {path:'admission/new',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-create.component').then(m=>m.AdmissionCreateComponent)},
 {path:'admission/list',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-list.component').then(m=>m.AdmissionListComponent)},
 {path:'admission/detail/:guid',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-detail.component').then(m=>m.AdmissionDetailComponent)},
 {path:'admission/identity',canActivate:[authGuard],data:{kind:'Identity'},loadComponent:()=>import('./features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)},
 {path:'admission/history',canActivate:[authGuard],data:{kind:'History'},loadComponent:()=>import('./features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)},
 {path:'admission/discharge',canActivate:[authGuard],data:{kind:'Clearance'},loadComponent:()=>import('./features/admission/admission-review.component').then(m=>m.AdmissionReviewComponent)},
 {path:'admission/his',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-his.component').then(m=>m.AdmissionHisComponent)},
 {path:'admission/stats',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-stats.component').then(m=>m.AdmissionStatsComponent)},
 {path:'admission',pathMatch:'full',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-dashboard.component').then(m=>m.AdmissionDashboardComponent)},
 {path:'hemo/requests/new',canActivate:[authGuard],data:{source:'Nurse'},loadComponent:()=>import('./features/blood-requests/request-form.component').then(m=>m.RequestFormComponent)},
 {path:'hemo/requests/orders',canActivate:[authGuard],data:{source:'Doctor'},loadComponent:()=>import('./features/blood-requests/request-form.component').then(m=>m.RequestFormComponent)},
 {path:'hemo/requests/edit/:guid',canActivate:[authGuard],loadComponent:()=>import('./features/blood-requests/request-form.component').then(m=>m.RequestFormComponent)},
 {path:'hemo/requests/detail/:guid',canActivate:[authGuard],loadComponent:()=>import('./features/blood-requests/request-detail.component').then(m=>m.RequestDetailComponent)},
 {path:'hemo/requests/bank/:guid',canActivate:[authGuard],data:{bank:true},loadComponent:()=>import('./features/blood-requests/request-detail.component').then(m=>m.RequestDetailComponent)},
 {path:'hemo/requests/bank',canActivate:[authGuard],data:{mode:'bank'},loadComponent:()=>import('./features/blood-requests/request-list.component').then(m=>m.RequestListComponent)},
 {path:'hemo/requests/approval',canActivate:[authGuard],data:{mode:'approval'},loadComponent:()=>import('./features/blood-requests/request-list.component').then(m=>m.RequestListComponent)},
 {path:'hemo/requests/doctor',canActivate:[authGuard],data:{mode:'approval'},loadComponent:()=>import('./features/blood-requests/request-list.component').then(m=>m.RequestListComponent)},
 {path:'hemo/requests',canActivate:[authGuard],pathMatch:'full',loadComponent:()=>import('./features/blood-requests/request-list.component').then(m=>m.RequestListComponent)},
 {path:'',pathMatch:'full',redirectTo:'admission'},{path:'**',redirectTo:'admission'}
];
