import {Routes} from '@angular/router';
import {authGuardGuard} from '../../Shared/AuthGuard/auth-guard.guard';
const list=()=>import('../../features/hemovigilance/hv-list.component').then(m=>m.HvListComponent);
const dashboard=()=>import('../../features/hemovigilance/hv-dashboard.component').then(m=>m.HvDashboardComponent);
export const hemoHvReadRoutes:Routes=[
 {path:'hemo/hv/cases',canActivate:[authGuardGuard],data:{mode:'cases'},loadComponent:list},
 {path:'hemo/hv/doctor',canActivate:[authGuardGuard],data:{mode:'doctor'},loadComponent:list},
 {path:'hemo/hv/bank',canActivate:[authGuardGuard],data:{mode:'bank'},loadComponent:list},
 {path:'hemo/hv/rca',canActivate:[authGuardGuard],data:{mode:'rca'},loadComponent:list},
 {path:'hemo/hv/capa',canActivate:[authGuardGuard],data:{mode:'capa'},loadComponent:list},
 {path:'hemo/hv',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:dashboard}
];
