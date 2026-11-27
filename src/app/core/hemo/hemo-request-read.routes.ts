import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';

const load=()=>import('../../features/blood-requests/request-list.component').then(m=>m.RequestListComponent);
const detail=()=>import('../../features/blood-requests/request-detail.component').then(m=>m.RequestDetailComponent);
const form=()=>import('../../features/blood-requests/request-form.component').then(m=>m.RequestFormComponent);
export const hemoRequestReadRoutes:Routes=[
  {path:'hemo/requests/new',canActivate:[authGuardGuard],data:{source:'Nurse'},loadComponent:form},
  {path:'hemo/requests/orders',canActivate:[authGuardGuard],data:{source:'Doctor'},loadComponent:form},
  {path:'hemo/requests/edit/:guid',canActivate:[authGuardGuard],loadComponent:form},
  {path:'hemo/requests/bank/:guid',canActivate:[authGuardGuard],data:{bank:true},loadComponent:detail},
  {path:'hemo/requests/detail/:guid',canActivate:[authGuardGuard],loadComponent:detail},
  {path:'hemo/requests/bank',canActivate:[authGuardGuard],data:{mode:'bank'},loadComponent:load},
  {path:'hemo/requests/approval',canActivate:[authGuardGuard],data:{mode:'approval'},loadComponent:load},
  {path:'hemo/requests/doctor',canActivate:[authGuardGuard],data:{mode:'approval'},loadComponent:load},
  {path:'hemo/requests',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:load}
];
