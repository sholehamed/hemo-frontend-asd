import { Routes } from '@angular/router';
import { MENU_ROLE_CONTEXT } from './app/Shared/layout/component/menu-role-context';
import { HemoRoleLifecycle } from './app/core/hemo/hemo-role-lifecycle';
import { hemoAdmissionPilotRoutes } from './app/core/hemo/hemo-admission-pilot.routes';
import { hemoQualityReadRoutes } from './app/core/hemo/hemo-quality-read.routes';
import { hemoHvReadRoutes } from './app/core/hemo/hemo-hv-read.routes';
import { hemoTransferReadRoutes } from './app/core/hemo/hemo-transfer-read.routes';
import { hemoBankReadRoutes } from './app/core/hemo/hemo-bank-read.routes';
import { hemoRequestReadRoutes } from './app/core/hemo/hemo-request-read.routes';
import { AppLayout } from './app/Shared/layout/component/app.layout';
import { Dashboard } from './app/Shared/pages/dashboard/dashboard';
import { Notfound } from './app/Shared/pages/notfound/notfound';
import { authGuardGuard } from './app/Shared/AuthGuard/auth-guard.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        providers: [{provide: MENU_ROLE_CONTEXT, useExisting: HemoRoleLifecycle}],

        children: [
            ...hemoAdmissionPilotRoutes,
            ...hemoRequestReadRoutes,
            ...hemoBankReadRoutes,
            ...hemoTransferReadRoutes,
            ...hemoHvReadRoutes,
            ...hemoQualityReadRoutes,
            { path: '', component: Dashboard, canActivate: [authGuardGuard], },
            { path: 'Identity', loadChildren: () => import('./app/Projects/Identity/Identity.routes') },
            { path: 'pages', loadChildren: () => import('./app/Shared/pages/pages.routes') },

        ]
    },

    { path: 'auth', loadChildren: () => import('./app/Shared/pages/auth/auth.routes') },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
