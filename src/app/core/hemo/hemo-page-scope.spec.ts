import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoCompanyHttp } from '../api/hemo-company-http';
import { HemoRoleLifecycle } from './hemo-role-lifecycle';
import { HemoPageScope } from './hemo-page-scope';

describe('R02 page-bound HEMO transport',()=>{
  let current:boolean;
  let scope:HemoPageScope;
  let api:HemoCompanyHttp;
  let http:HttpTestingController;
  const path='/Identity/PatientAdmission/BindPaging';
  beforeEach(()=>{
    current=true;
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),
      {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
      HemoPageScope,HemoCompanyHttp]});
    scope=TestBed.inject(HemoPageScope);api=TestBed.inject(HemoCompanyHttp);http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  it('rejects requests started after the page is destroyed',async()=>{
    const operation=api.post(path,{});
    scope.ngOnDestroy();
    await expectAsync(firstValueFrom(operation)).toBeRejected();
    http.expectNone('https://fixture.invalid'+path);
  });
  it('rejects an in-flight response decoded after role change',async()=>{
    const pending=firstValueFrom(api.post(path,{}));
    const check=expectAsync(pending).toBeRejected();
    const r=http.expectOne('https://fixture.invalid'+path);
    current=false;
    r.flush(new Blob(['{"data":[{"firstName":"fixture"}]}'],{type:'application/json'}));
    await check;
    expect(scope.isCurrent()).toBeFalse();
  });
  it('returns valid current data and permanently invalidates a closed page',async()=>{
    const pending=firstValueFrom(api.post<{totalCount:number}>(path,{}));
    http.expectOne('https://fixture.invalid'+path).flush(new Blob(['{"totalCount":1}'],{type:'application/json'}));
    expect((await pending).totalCount).toBe(1);
    scope.invalidate();current=true;
    expect(scope.isCurrent()).toBeFalse();
    await expectAsync(firstValueFrom(api.post(path,{}))).toBeRejected();
    http.expectNone('https://fixture.invalid'+path);
  });
});
