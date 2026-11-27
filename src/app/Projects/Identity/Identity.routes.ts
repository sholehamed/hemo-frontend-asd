import { Routes } from '@angular/router';

export default [
    { path: 'UserManagement', loadChildren: () => import('./UserManagement/UserManagement.routes') },
    { path: 'SystemSetting', loadChildren: () => import('./SystemSetting/SystemSetting.routes') },
    { path: 'Organization', loadChildren: () => import('./Organization/Organization.routes') },
    { path: 'Package', loadChildren: () => import('./Package/Package.routes') },
    { path: 'Ticket', loadChildren: () => import('./ticket/ticket.routes') },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
