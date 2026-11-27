import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './AuthService';
import { Router } from '@angular/router';
import { StaticFunctions } from './StaticFunctions';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

const refreshTokenInProgress = new BehaviorSubject<boolean>(false);
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {


    AuthService.RequestCount++;
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    const token = authService.GetAccessToken();
    let url = sessionStorage.getItem("url");
    let UserRole = authService.GetUserRole();
    let headers = req.headers
        .set('Authorization', `Bearer ${token}`)
        .set('Url', url ?? '')
        .set('UserRole', (UserRole > 0) ? UserRole.toString() : '')
        .set('SystemGUID', environment.SystemGUID);

    let Address = ((window.location.href.includes('.ir')||window.location.href.includes('asd.at'))) ? req.url : req.url.replace('https://', 'http://').replace('.bolut.ir', '.bolut.net');
    const clonedRequest = req.clone({ headers, url: Address });

    return next(clonedRequest).pipe(
        tap((a: any) => {
            if (a.ok == true) {
                AuthService.RequestCount--;
            }

        }),
        catchError((error: HttpErrorResponse) => {
            AuthService.RequestCount--;
            if (error.status === 401 && !clonedRequest.url.includes('Identity/user/RefreshToken')) {
                return handle401Error(clonedRequest, next, authService, router);
            }
            if (error.status === 429) {
                StaticFunctions.ShowError(messageService, 'تعداد درخواست بیش از حد مجاز می‌باشد، لطفاً بعداً مجدد تلاش نمایید');
            }
            if (error.status === 400 && error.error) {
                const reader = new FileReader();
                reader.onload = () => {

                    try {
                        const errorText = reader.result as string;
                        const errorJson = JSON.parse(errorText);
                        StaticFunctions.ShowError(messageService, errorJson.detail);
                    } catch {
                        StaticFunctions.ShowError(messageService, 'خطای سرور رخ داده است');
                    }

                };
                reader.readAsText(error.error);
            }
            if (error.status === 403 && clonedRequest.url.includes('Identity/user/RefreshToken')) {
                authService.LogOut();
            }
            else if (error.status === 403) {
                StaticFunctions.ShowError(messageService, 'شما دسترسی لازم را ندارید');
            }

            return throwError(() => error);
        })
    );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, router: Router) {
    if (!refreshTokenInProgress.value) {
        refreshTokenInProgress.next(true);
        refreshTokenSubject.next(null);

        return authService.RefreshTokenToken().pipe(
            switchMap(authResponse => {
                authService.SetToken(authResponse, false);
                refreshTokenInProgress.next(false);
                refreshTokenSubject.next(authResponse.key!);
                return next(req.clone({ setHeaders: { Authorization: `Bearer ${authResponse.key!}` } }));
            }),
            catchError(err => {
                refreshTokenInProgress.next(false);
                if (err.status === 401) {
                    authService.LogOut();
                }
                return throwError(() => err);
            })
        );
    } else {
        return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
        );
    }
}
