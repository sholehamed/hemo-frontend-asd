import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from './app/Shared/Services/AuthService';
import { AuthInterceptor } from './app/Shared/Services/AuthInterceptor';
import { API_BASE_URL } from './app/Services/api-client';
import { environment } from './environments/environment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS } from './tools/material.persian-date.adapter';

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: API_BASE_URL, useValue: environment.apiUrl },
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            translation: {
                startsWith: 'شروع با',
                contains: 'حاوی',
                notContains: 'حاوی نباشد',
                endsWith: 'پایان‌یافته با',
                equals: 'مساوی با',
                notEquals: 'نامساوی با',
                noFilter: 'بدون فیلتر',
                lt: 'کوچکتر از',
                lte: 'کوچکتر یا مساوی',
                gt: 'بزرگتر از',
                gte: 'بزرگتر یا مساوی',
                dateIs: 'تاریخ برابر با',
                dateIsNot: 'تاریخ نامساوی با',
                dateAfter: 'تاریخ بعد از',
                dateBefore: 'تاریخ قبل از',
                matchAll: 'تمام شرط ها برقرار باشد',
                matchAny: 'حداقل یک شرط برقرار باشد',
                addRule: 'شرط جدید',
                apply: 'قبول',
                clear: 'حذف',
                accept: 'بله',
                reject: 'خیر',
                emptyMessage:'موردی یافت نشد'
            }
        }),
        { provide: DateAdapter, useClass: MaterialPersianDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: PERSIAN_DATE_FORMATS },
        provideHttpClient(withInterceptors([AuthInterceptor])),
        AuthService,
        MessageService,
        ConfirmationService,
        { provide: API_BASE_URL, useValue: environment.apiUrl }, provideAnimationsAsync()
    ]
};

