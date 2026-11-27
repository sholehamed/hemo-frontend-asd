import {Routes} from '@angular/router';
import {authGuardGuard} from '../../Shared/AuthGuard/auth-guard.guard';
const equipment=()=>import('../../features/quality/equipment-list.component').then(m=>m.EquipmentListComponent);
const records=()=>import('../../features/quality/quality-list.component').then(m=>m.QualityListComponent);
export const hemoQualityReadRoutes:Routes=[
 {path:'hemo/quality/equipment-dashboard',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/quality/equipment-dashboard.component').then(m=>m.EquipmentDashboardComponent)},
 {path:'hemo/quality/equipment',canActivate:[authGuardGuard],data:{mode:'equipment'},loadComponent:equipment},
 {path:'hemo/quality/maintenance',canActivate:[authGuardGuard],data:{mode:'maintenance'},loadComponent:equipment},
 {path:'hemo/quality/temperature',canActivate:[authGuardGuard],data:{mode:'temperature'},loadComponent:equipment},
 {path:'hemo/quality/incidents',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/quality/equipment-incidents.component').then(m=>m.EquipmentIncidentsComponent)},
 {path:'hemo/quality/qc',canActivate:[authGuardGuard],data:{kind:'Qc'},loadComponent:records},
 {path:'hemo/quality/committee',canActivate:[authGuardGuard],data:{kind:'Committee'},loadComponent:records},
 {path:'hemo/quality/audit',canActivate:[authGuardGuard],data:{kind:'Audit'},loadComponent:records},
 {path:'hemo/quality/training',canActivate:[authGuardGuard],data:{kind:'Training'},loadComponent:records},
 {path:'hemo/quality',pathMatch:'full',canActivate:[authGuardGuard],loadComponent:()=>import('../../features/quality/quality-dashboard.component').then(m=>m.QualityDashboardComponent)}
];
