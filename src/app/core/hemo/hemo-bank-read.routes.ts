import { Routes } from '@angular/router';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
const dashboard=()=>import('../../features/blood-bank/bank-dashboard.component').then(m=>m.BankDashboardComponent);
const inventory=()=>import('../../features/blood-bank/bank-inventory.component').then(m=>m.BankInventoryComponent);
export const hemoBankReadRoutes:Routes=[
  {path:'hemo/bank/crossmatch',canActivate:[authGuardGuard],data:{mode:'lab'},loadComponent:inventory},
  {path:'hemo/bank/thaw',canActivate:[authGuardGuard],data:{mode:'thaw'},loadComponent:inventory},
  {path:'hemo/bank/temperature',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/blood-bank/bank-temperature.component').then(m=>m.BankTemperatureComponent)},
  {path:'hemo/bank/lab-history',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/blood-bank/bank-lab-history.component').then(m=>m.BankLabHistoryComponent)},
  {path:'hemo/bank/receive',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/blood-bank/bank-receive.component').then(m=>m.BankReceiveComponent)},
  {path:'hemo/bank/unit/:guid',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/blood-bank/bank-unit.component').then(m=>m.BankUnitComponent)},
  {path:'hemo/bank/inventory',canActivate:[authGuardGuard],loadComponent:inventory},
  {path:'hemo/bank/reports',canActivate:[authGuardGuard],data:{report:true},loadComponent:dashboard},
  {path:'hemo/bank',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:dashboard}
];
