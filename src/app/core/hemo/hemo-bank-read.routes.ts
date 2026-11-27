import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
const dashboard=()=>import('../../features/blood-bank/bank-dashboard.component').then(m=>m.BankDashboardComponent);
const inventory=()=>import('../../features/blood-bank/bank-inventory.component').then(m=>m.BankInventoryComponent);
export const hemoBankReadRoutes:Routes=[
  {path:'hemo/bank/inventory',canActivate:[authGuardGuard],loadComponent:inventory},
  {path:'hemo/bank/reports',canActivate:[authGuardGuard],data:{report:true},loadComponent:dashboard},
  {path:'hemo/bank',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:dashboard}
];
