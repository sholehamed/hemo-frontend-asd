
import { Routes } from '@angular/router';
import { UserWithPaginationComponent } from './UserWithPagination/UserWithPagination.component';
import { RoleWithPaginationComponent } from './RoleWithPagination/RoleWithPagination.component';
import { authGuardGuard } from '../../../Shared/AuthGuard/auth-guard.guard';
import { CreateRoleComponent } from './RoleWithPagination/CreateRole/CreateRole.component';
import { RoleAccessWithPaginationComponent } from './RoleAccessWithPagination/RoleAccessWithPagination.component';
import { CreateRoleAccessComponent } from './RoleAccessWithPagination/CreateRoleAccess/CreateRoleAccess.component';
import { UserRoleWithPaginationComponent } from './UserRoleWithPagination/UserRoleWithPagination.component';
import { CreateUserRoleComponent } from './UserRoleWithPagination/CreateUserRole/CreateUserRole.component';
import { StaticFunctions } from '../../../Shared/Services/StaticFunctions';
import { CreateUserComponent } from './UserWithPagination/CreateUser/CreateUser.component';
import { OrglocationRoleAccessComponent } from './orglocation-role-access/orglocation-role-access.component';
import { UserInviteWithPaginationComponent } from './UserInviteWithPagination/UserInviteWithPagination.component';
import { CreateUserInviteComponent } from './UserInviteWithPagination/CreateUserInvite/CreateUserInvite.component';

export default [
    { path: "UserInvite", component: UserInviteWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },
    { path: "UserInvite/CreateUserInvite", component: CreateUserInviteComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },

    { path: "User", component: UserWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },
    { path: "User/CreateUser", component: CreateUserComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "User/ChangeUser/:GUID", component: CreateUserComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "OrglocationUser", component: UserWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },
    { path: "Role", component: RoleWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "OrglocationRole", component: RoleWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "Role/CreateRole/:pguid", component: CreateRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "OrglocationRole/CreateOrglocationRole/:pguid", component: CreateRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},

    { path: "Role/ChangeRole/:guid", component: CreateRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "OrglocationRole/ChangeOrglocationRole/:guid", component: CreateRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},


    { path: "Role/RoleAccess/:RoleGUID", component: RoleAccessWithPaginationComponent, canActivate: [authGuardGuard], data: { animation:StaticFunctions.GetUUID() }},
    { path: "Role/RoleAccess/CreateRoleAccess/:RoleGUID", component: CreateRoleAccessComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "UserRole/:UserGuid", component: UserRoleWithPaginationComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "UserRole/CreateUserRole/:UserGuid", component: CreateUserRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "UserRole/ChangeUserRole/:UserGuid/:GUID", component: CreateUserRoleComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() }},
    { path: "OrglocationRole/OrglocationRoleAccess/:RoleGUID", component: OrglocationRoleAccessComponent, canActivate: [authGuardGuard], data: { animation:StaticFunctions.GetUUID() }},


    { path: '**', redirectTo: '/notfound' }
] as Routes;
