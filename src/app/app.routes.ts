import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
export const routes:Routes=[
 {path:'login',loadComponent:()=>import('./features/login/login.component').then(m=>m.LoginComponent)},
 {path:'admission',canActivate:[authGuard],loadComponent:()=>import('./features/admission/admission-dashboard.component').then(m=>m.AdmissionDashboardComponent)},
 {path:'',pathMatch:'full',redirectTo:'admission'},{path:'**',redirectTo:'admission'}
];
