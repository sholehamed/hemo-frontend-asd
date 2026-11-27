import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, UserLoginCommand } from '../../Services/api-client';
import { HemoLoginClient } from './hemo-login-client';
import { LOGIN_CONTEXT_CLIENT } from '../../Shared/pages/auth/login-context';
import authRoutes from '../../Shared/pages/auth/auth.routes';

describe('R02 HEMO login adapter',()=>{
  it('is scoped to the original login route and uses existing HEMO endpoint with the original DTO',async()=>{
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),{provide:API_BASE_URL,useValue:'https://fixture.invalid'}]});
    const http=TestBed.inject(HttpTestingController);
    const command=new UserLoginCommand({username:'fixture',password:'fixture-password',captchaId:'id',userEnteredCaptchaCode:'code',otpCode:'123456'});
    const result=firstValueFrom(TestBed.inject(HemoLoginClient).login(command));
    const r=http.expectOne('https://fixture.invalid/Identity/HemoSession/Login');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(command);
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob(['{"key":"fixture-token","userRole":42,"forceChangePassword":false}'],{type:'application/json'}));
    expect((await result).userRole).toBe(42);
    http.verify();
    const route=authRoutes.find(x=>x.path==='login')!;
    expect(route.providers).toContain(jasmine.objectContaining({provide:LOGIN_CONTEXT_CLIENT,useExisting:HemoLoginClient}));
  });
});
