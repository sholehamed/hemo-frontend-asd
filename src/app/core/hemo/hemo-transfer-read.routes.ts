import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
const dashboard=()=>import('../../features/transfusion/transfer-dashboard.component').then(m=>m.TransferDashboardComponent);
const list=()=>import('../../features/transfusion/transfer-list.component').then(m=>m.TransferListComponent);
export const hemoTransferReadRoutes:Routes=[
  {path:'hemo/transfusion/tasks',canActivate:[authGuardGuard],data:{mode:'tasks'},loadComponent:list},
  {path:'hemo/transfusion/vitals',canActivate:[authGuardGuard],data:{mode:'vitals'},loadComponent:list},
  {path:'hemo/transfusion/monitoring',canActivate:[authGuardGuard],data:{mode:'monitoring'},loadComponent:list},
  {path:'hemo/transfusion/returns',canActivate:[authGuardGuard],data:{mode:'returns'},loadComponent:list},
  {path:'hemo/transfusion/records',canActivate:[authGuardGuard],data:{mode:'records'},loadComponent:list},
  {path:'hemo/transfusion',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:dashboard}
];
