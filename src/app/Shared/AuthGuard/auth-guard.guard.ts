import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/AuthService';
import { of, switchMap } from 'rxjs';

export const authGuardGuard: CanActivateFn = (route, state) => {

    const authService = inject(AuthService);
    const url = getRoutePattern(route);
    sessionStorage.setItem('url', url);

    if (!authService.UserIsAthenticated()) {
        authService.OpenLoginPage();
        return of(false);
    }

    if(url=='/'){
        return true;
    }

    return authService.CheckPagePermission(url).pipe(
        switchMap((hasPermission: boolean) => {
            if (!hasPermission) {
                authService.OpenforbiddenPage();
                return of(false);
            }
            return of(true);
        })
    );


};
function getRoutePattern(route: ActivatedRouteSnapshot): string {
    const pathSegments: string[] = [];

    let currentRoute: ActivatedRouteSnapshot | null = route;
    while (currentRoute) {
        if (currentRoute.routeConfig?.path) {
            pathSegments.unshift(currentRoute.routeConfig.path);
        }
        currentRoute = currentRoute.parent;
    }

    return `/${pathSegments.join('/')}`;
}
