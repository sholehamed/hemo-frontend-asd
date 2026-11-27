import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { identityInterceptor } from './core/auth/identity.interceptor';
export const appConfig: ApplicationConfig = { providers: [provideZonelessChangeDetection(),provideHttpClient(withInterceptors([identityInterceptor])),provideRouter(routes)] };
