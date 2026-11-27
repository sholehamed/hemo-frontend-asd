import { Routes } from '@angular/router';
import { CurrentUserInvitesComponent } from './CurrentUserInvites/CurrentUserInvites.component';
import { authGuardGuard } from '../AuthGuard/auth-guard.guard';
import { StaticFunctions } from '../Services/StaticFunctions';
import { ProfileComponent } from './profile/profile.component';

export default [
    { path: "CurrentUserInvites", component: CurrentUserInvitesComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },
    { path: "Profile", component: ProfileComponent, canActivate: [authGuardGuard], data: { animation: StaticFunctions.GetUUID() } },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
