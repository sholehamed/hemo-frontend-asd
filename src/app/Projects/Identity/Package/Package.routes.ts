import { Routes } from '@angular/router';
import { GetPackageWithPaginationComponent } from './GetPackageWithPagination/GetPackageWithPagination.component';
import { authGuardGuard } from '../../../Shared/AuthGuard/auth-guard.guard';
import { StaticFunctions } from '../../../Shared/Services/StaticFunctions';
import { CreatePackageComponent } from './GetPackageWithPagination/CreatePackage/CreatePackage.component';
import { CreatePackageCategoryComponent } from './GetPackageCategoryWithPagination/CreatePackageCategory/CreatePackageCategory.component';
import { GetPackageCategoryWithPaginationComponent } from './GetPackageCategoryWithPagination/GetPackageCategoryWithPagination.component';
import { GetOrglocationPackageWithPaginationComponent } from './GetOrglocationPackageWithPagination/GetOrglocationPackageWithPagination.component';
import { GetDiscountWithPaginationComponent } from './GetDiscountWithPagination/GetDiscountWithPagination.component';
import { CreateDiscountComponent } from './GetDiscountWithPagination/CreateDiscount/CreateDiscount.component';
import { GetDemoRequestWithPaginationComponent } from './GetDemoRequestWithPagination/GetDemoRequestWithPagination.component';

export default [
    {
        path: 'PackageCategory', component: GetPackageCategoryWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'OrglocationPackage', component: GetOrglocationPackageWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },


    {
        path: 'PackageCategory/CreatePackageCategory', component: CreatePackageCategoryComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'PackageCategory/ChangePackageCategory/:GUID', component: CreatePackageCategoryComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Package/:PackageCategoryGUID/:Title', component: GetPackageWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },

    {
        path: 'Package/CreatePackage/:PackageCategoryGUID/:Title', component: CreatePackageComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'Package/ChangePackage/:GUID/:PackageCategoryGUID/:Title', component: CreatePackageComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },

    {
        path: 'Discount', component: GetDiscountWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'CreateDiscount', component: CreateDiscountComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'ChangeDiscount/:GUID', component: CreateDiscountComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },


      {
        path: 'UserDemoRequests/:UserGUID', component: GetDemoRequestWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },
    {
        path: 'DemoRequests', component: GetDemoRequestWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },

    {
        path: 'DemoRequestConfirms', component: GetDemoRequestWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },

    {
        path: 'DemoRequestNotConfirms', component: GetDemoRequestWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }
    },

    { path: '**', redirectTo: '/notfound' }
] as Routes;



