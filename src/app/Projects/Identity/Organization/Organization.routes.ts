import { Routes } from '@angular/router';
import { authGuardGuard } from '../../../Shared/AuthGuard/auth-guard.guard';
import { OrgLocationWithPaginationComponent } from './OrgLocationWithPagination/OrgLocationWithPagination.component';
import { CreateOrgLocationComponent } from './OrgLocationWithPagination/CreateOrgLocation/CreateOrgLocation.component';
import { StaticFunctions } from '../../../Shared/Services/StaticFunctions';
import { GetOrgLocationTypeWithPaginationComponent } from './GetOrgLocationTypeWithPagination/GetOrgLocationTypeWithPagination.component';
import { CreateOrgLocationTypeComponent } from './GetOrgLocationTypeWithPagination/CreateOrgLocationType/CreateOrgLocationType.component';
import { GetOrglocationPackageWithPaginationComponent } from './GetOrglocationPackageWithPagination/GetOrglocationPackageWithPagination.component';
import { CreateOrglocationPackageComponent } from './GetOrglocationPackageWithPagination/CreateOrglocationPackage/CreateOrglocationPackage.component';

export default [

      {
            path: 'OrgLocationType', component: GetOrgLocationTypeWithPaginationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
        },
        
        {
            path: 'OrgLocationType/CreateOrgLocationType', component: CreateOrgLocationTypeComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
        },
        {
            path: 'OrgLocationType/ChangeOrgLocationType/:GUID', component: CreateOrgLocationTypeComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
        },

  
    {
        path: 'OrgLocation', component: OrgLocationWithPaginationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrgLocation/CreateOrgLocation', component: CreateOrgLocationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrgLocation/CreateChildOrgLocation/:PGUID', component: CreateOrgLocationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrgLocation/ChangeOrgLocation/:GUID', component: CreateOrgLocationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrgLocation/OrglocationPackage/:OrglocationGuid', component: GetOrglocationPackageWithPaginationComponent, canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrgLocation/CreateOrglocationPackage/:OrglocationGuid', component:CreateOrglocationPackageComponent , canActivate: [authGuardGuard],data: { animation: StaticFunctions.GetUUID() }
    },

    { path: '**', redirectTo: '/notfound' }
] as Routes;



