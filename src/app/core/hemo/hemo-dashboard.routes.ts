import {Routes} from '@angular/router';
import {authGuardGuard} from '../../Shared/AuthGuard/auth-guard.guard';
export const hemoDashboardRoutes:Routes=[
 {path:'hemo/dashboard',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/home/home.component').then(m=>m.HomeComponent)}
];
