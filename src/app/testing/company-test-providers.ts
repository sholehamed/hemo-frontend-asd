import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS } from '../../tools/material.persian-date.adapter';
import { API_BASE_URL } from '../Services/api-client';
export function companyTestProviders() {
  return [
    provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(),
    ConfirmationService, MessageService,
    {provide: API_BASE_URL, useValue: 'https://fixture.invalid'},
    {provide: DateAdapter, useClass: MaterialPersianDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: PERSIAN_DATE_FORMATS}
  ];
}
