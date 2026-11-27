import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { API_BASE_URL } from '../../Services/api-client';
import { AuthInterceptor } from '../../Shared/Services/AuthInterceptor';
import { AuthService } from '../../Shared/Services/AuthService';
import { environment } from '../../../environments/environment';
import { AdmissionsService } from './admissions.service';

describe('R02 admission API with company interceptor', () => {
  let http: HttpTestingController;
  let api: AdmissionsService;
  let saved: string | null;
  beforeEach(() => {
    saved = sessionStorage.getItem('url');
    sessionStorage.setItem('url', '/admission/stats');
    TestBed.configureTestingModule({providers: [
      provideHttpClient(withInterceptors([AuthInterceptor])), provideHttpClientTesting(),
      provideRouter([]), MessageService,
      {provide: API_BASE_URL, useValue: 'https://fixture.invalid/api/'},
      {provide: AuthService, useValue: {GetAccessToken: () => 'fixture-token', GetUserRole: () => 42}}
    ]});
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(AdmissionsService);
  });
  afterEach(() => {
    http.verify();
    if (saved === null) sessionStorage.removeItem('url'); else sessionStorage.setItem('url', saved);
  });
  it('sends company base URL, page, role and system headers and decodes JSON', async () => {
    const result = api.stats({ward: 'fixture'});
    const r = http.expectOne(req => req.url.endsWith('fixture.invalid/api/Identity/PatientAdmission/Stats'));
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ward:'fixture'});
    expect(r.request.headers.get('Authorization')).toBe('Bearer fixture-token');
    expect(r.request.headers.get('UserRole')).toBe('42');
    expect(r.request.headers.get('Url')).toBe('/admission/stats');
    expect(r.request.headers.get('SystemGUID')).toBe(environment.SystemGUID);
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob([JSON.stringify({total:7,active:7,verified:0,mismatch:0,ready:0,wards:[],bloodGroups:[]})], {type:'application/json'}));
    expect((await result).total).toBe(7);
  });
  it('preserves query parameters and handles JSON null', async () => {
    const result = api.find('NationalId','fixture-id');
    const r = http.expectOne(req=>req.url.endsWith('/Identity/PatientAdmission/FindPatient'));
    expect(r.request.params.get('identificationType')).toBe('NationalId');
    expect(r.request.params.get('identificationNumber')).toBe('fixture-id');
    r.flush(new Blob(['null'],{type:'application/json'}));
    expect(await result).toBeNull();
  });
  it('retains 403 and decoded ProblemDetails without granting access', async () => {
    const result = api.stats();
    const check = expectAsync(result).toBeRejectedWith(jasmine.objectContaining({
      status:403, error: {detail:'fixture forbidden'}
    }));
    const r = http.expectOne(req=>req.url.endsWith('/Identity/PatientAdmission/Stats'));
    r.flush(new Blob(['{"detail":"fixture forbidden"}'],{type:'application/problem+json'}),{status:403,statusText:'Forbidden'});
    await check;
  });
  it('keeps empty success responses and 400 compatible with existing Blob error handler', async () => {
    const result = api.review({guid:'fixture',kind:'Identity',outcome:'Verified',checklist:31,notes:null,version:'v1'});
    const r = http.expectOne(req=>req.url.endsWith('/Identity/PatientAdmission/Review'));
    r.flush(null,{status:204,statusText:'No Content'});
    expect(await result).toBeUndefined();
    const invalid = api.stats();
    const check = expectAsync(invalid).toBeRejectedWith(jasmine.objectContaining({status:400,error:{detail:'fixture invalid'}}));
    http.expectOne(req=>req.url.endsWith('/Identity/PatientAdmission/Stats')).flush(
      new Blob(['{"detail":"fixture invalid"}'],{type:'application/problem+json'}),{status:400,statusText:'Bad Request'});
    await check;
  });
});
