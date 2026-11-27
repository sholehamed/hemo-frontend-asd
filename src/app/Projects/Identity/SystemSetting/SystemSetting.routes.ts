import { MenuApiWithPaginationComponent } from './MenuApiWithPagination/MenuApiWithPagination.component';
import { Routes } from '@angular/router';
import { SubSystemWithPaginationComponent } from './SubSystemWithPagination/SubSystemWithPagination.component';
import { ApiWithPaginationComponent } from './ApiWithPagination/ApiWithPagination.component';
import { MenuWithPaginationComponent } from './MenuWithPagination/MenuWithPagination.component';
import { CreateSubSystemComponent } from './SubSystemWithPagination/CreateSubSystem/CreateSubSystem.component';
import { authGuardGuard } from '../../../Shared/AuthGuard/auth-guard.guard';
import { CreateMenuComponent } from './MenuWithPagination/CreateMenu/CreateMenu.component';
import { StaticFunctions } from '../../../Shared/Services/StaticFunctions';

export default [
    {
        path: 'SubSystem', component: SubSystemWithPaginationComponent, canActivate: [authGuardGuard],data: { animation:StaticFunctions.GetUUID() }
    },
    { path: "SubSystem/CreateSubSystem", component: CreateSubSystemComponent, canActivate: [authGuardGuard], data: { animation:StaticFunctions.GetUUID() }},
    { path: "SubSystem/ChangeSubSystem/:guid", component: CreateSubSystemComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "Menu", component: MenuWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "Menu/CreateMenu/:pguid", component: CreateMenuComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "Menu/ChangeMenu/:guid", component: CreateMenuComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }}
    ,{ path: "Api", component: ApiWithPaginationComponent, canActivate: [authGuardGuard], data: { animation:StaticFunctions.GetUUID() }},
    {
    path: 'MenuApi', component: MenuApiWithPaginationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
},
    { path: '**', redirectTo: '/notfound' }
] as Routes;



