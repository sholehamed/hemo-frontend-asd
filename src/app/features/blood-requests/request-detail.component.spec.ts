import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { RequestDetailComponent } from './request-detail.component';
import { RequestPageAccess } from './request-page-access';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { blankClinical,RequestDetail } from './blood-request-model';

describe('R02 company request detail',()=>{
 let current:boolean,bank:boolean,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/BloodRequest';
 const fixture=(guid:string):RequestDetail=>({
   request:{guid,requestNumber:'REQ-'+guid,patientAdmissionGuid:'admission-a',patientName:'Fixture '+guid,hisNumber:'TEST',ward:'Ward',source:'Nurse',formType:'General',priority:'Routine',status:'AwaitingDoctor',created:'2026-01-01',submittedAt:null,totalUnits:1,owned:false},
   clientRequestId:'key',version:'AQID',bloodGroup:null,identityStatus:'Verified',bedNumber:'1',items:[],clinical:blankClinical(),history:[],admissionChanged:false
 });
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 beforeEach(()=>{
   current=true;bank=false;params=new BehaviorSubject(convertToParamMap({guid:'request-a'}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),snapshot:{get data(){return {bank};}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function start(caps:Record<string,boolean>,isBank=false){
   bank=isBank;const f=TestBed.createComponent(RequestDetailComponent);
   const access=spyOn(f.debugElement.injector.get(RequestPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));
   await access.calls.mostRecent().returnValue;
   return {f,load};
 }
 it('does not fetch detail without its explicit capability',async()=>{
   const {f,load}=await start({list:true});expect(load).not.toHaveBeenCalled();http.expectNone(base+'/request-a');f.destroy();
 });
 it('uses only the bank endpoint and never decides from the bank detail',async()=>{
   const {f,load}=await start({bankDetail:true,decide:true},true);
   http.expectOne(base+'/Bank/request-a').flush(blob(fixture('request-a')));
   await load.calls.mostRecent().returnValue;f.detectChanges();
   http.expectNone(base+'/request-a');expect(f.nativeElement.textContent).toContain('Fixture request-a');
   await f.componentInstance.act('Approve');http.expectNone(base+'/Decide');f.destroy();
 });
 it('sends an explicitly confirmed physician decision with the loaded version and reloads',async()=>{
   const {f,load}=await start({detail:true,decide:true});
   http.expectOne(base+'/request-a').flush(blob(fixture('request-a')));
   await load.calls.mostRecent().returnValue;
   const c=f.componentInstance;const confirm=spyOn(window,'confirm').and.returnValue(true);
   await c.act('Approve');expect(confirm).not.toHaveBeenCalled();
   c.physician={diagnosis:'fixture',indication:'fixture',medicalCouncilNumber:'TEST',notes:null,confirmed:true};
   const transition=spyOn(f.debugElement.injector.get(BloodRequestsService),'transition').and.callThrough();
   const action=c.act('Approve');const req=http.expectOne(base+'/Decide');
   expect(req.request.body).toEqual({guid:'request-a',version:'AQID',action:'Approve',reason:null,physician:c.physician});
   req.flush(null,{status:204,statusText:'No Content'});
   await transition.calls.mostRecent().returnValue;
   http.expectOne(base+'/request-a').flush(blob({...fixture('request-a'),request:{...fixture('request-a').request,status:'AwaitingBank'}}));
   await action;expect(c.detail()?.request.status).toBe('AwaitingBank');expect(c.success()).not.toBeNull();f.destroy();
 });
 it('discards old route data on parameter reuse and invalidates print on role change',async()=>{
   const {f,load}=await start({detail:true});
   const old=http.expectOne(base+'/request-a');const first=load.calls.mostRecent().returnValue;
   params.next(convertToParamMap({guid:'request-b'}));const next=http.expectOne(base+'/request-b');const second=load.calls.mostRecent().returnValue;
   next.flush(blob(fixture('request-b')));await second;old.flush(blob(fixture('request-a')));await first;
   expect(f.componentInstance.detail()?.request.guid).toBe('request-b');
   current=false;f.detectChanges();expect(f.nativeElement.textContent).not.toContain('Fixture request-b');
   const print=spyOn(window,'print');f.componentInstance.print();expect(print).not.toHaveBeenCalled();f.destroy();
 });
});
