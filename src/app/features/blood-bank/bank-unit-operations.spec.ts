import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestPageAccess } from '../blood-requests/request-page-access';
import { BankPageAccess } from './bank-page-access';
import { BankReceiveComponent } from './bank-receive.component';
import { BankUnitComponent } from './bank-unit.component';
import { UnitDetail,UnitStatus } from './bank-model';
import { blankClinical,RequestDetail } from '../blood-requests/blood-request-model';

describe('R02 company bank unit operations',()=>{
 let current:boolean,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>,query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/BloodBank',requests='https://fixture.invalid/Identity/BloodRequest';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const unit=(guid='unit-a',status:UnitStatus='ReceivedHold'):UnitDetail=>({unit:{guid,unitCode:'FIXTURE-'+guid,productCode:'RBC',bloodGroup:'O+',batchNumber:null,supplySource:'fixture',equipmentCode:'fixture',receivedAt:'2026-01-01T00:00:00Z',expiresAt:'2026-01-04T00:00:00Z',status,expired:false,requestGuid:null,thawStartedAt:null,thawCompletedAt:null,version:'AQID'},events:[],tests:[],latestTemperature:null});
 const request=(guid:string):RequestDetail=>({request:{guid,requestNumber:'REQ-'+guid,patientAdmissionGuid:'patient-a',patientName:'Fixture '+guid,hisNumber:'TEST',ward:'Ward',source:'Nurse',formType:'General',priority:'Routine',status:'AwaitingBank',created:'2026-01-01',submittedAt:null,totalUnits:1,owned:false},clientRequestId:'fixture-key',version:'BAUG',bloodGroup:'O+',identityStatus:'Verified',bedNumber:'1',items:[{productCode:'RBC',quantity:1,requestedBloodGroup:null,specialInstructions:null}],clinical:blankClinical(),history:[],admissionChanged:false});
 beforeEach(()=>{
   current=true;params=new BehaviorSubject(convertToParamMap({guid:'unit-a'}));query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),queryParamMap:query.asObservable(),snapshot:{data:{},get paramMap(){return params.value;},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function receive(caps:Record<string,boolean>){
   const f=TestBed.createComponent(BankReceiveComponent);
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   const c=f.componentInstance;c.form={unitCode:'FIXTURE-001',productCode:'RBC',bloodGroup:'O+',batchNumber:'',supplySource:'fixture',equipmentCode:'fixture',notes:''};c.received={date:'1405/09/01',time:'10:00'};c.expiry={date:'1405/09/02',time:'10:00'};
   return {f,c};
 }
 async function detail(caps:Record<string,boolean>,requestCaps:Record<string,boolean>={}){
   const f=TestBed.createComponent(BankUnitComponent);
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();
   const requestAccess=spyOn(f.debugElement.injector.get(RequestPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   if(caps['unit']){http.expectOne(requests+'/Capabilities').flush(blob(requestCaps));await requestAccess.calls.mostRecent().returnValue;}
   return {f,c:f.componentInstance,load,api:f.debugElement.injector.get(BloodBankService)};
 }
 it('requires both receive and unit permissions',async()=>{
   const {f,c}=await receive({receive:true});await c.save();http.expectNone(base+'/Receive');f.destroy();
 });
 it('posts receipt once and retains confirmed identifier when navigation does not complete',async()=>{
   const {f,c}=await receive({receive:true,unit:true});const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(false);
   const task=c.save();const req=http.expectOne(base+'/Receive');expect(req.request.body.unitCode).toBe('FIXTURE-001');
   expect(Date.parse(req.request.body.expiresAt)).toBeGreaterThan(Date.parse(req.request.body.receivedAt));
   req.flush(blob('unit-a'));await task;
   expect(nav).toHaveBeenCalledWith(['/hemo/bank/unit','unit-a']);expect(c.savedGuid()).toBe('unit-a');
   await c.save();http.expectNone(base+'/Receive');f.destroy();
 });
 it('does not navigate on a late receipt after scope invalidation',async()=>{
   const {f,c}=await receive({receive:true,unit:true});const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   const task=c.save();const req=http.expectOne(base+'/Receive');current=false;req.flush(blob('unit-a'));await task;
   expect(nav).not.toHaveBeenCalled();expect(c.savedGuid()).toBeNull();f.destroy();
 });
 it('does not request a unit when its capability is absent',async()=>{
   const {f,c,load}=await detail({stats:true});expect(load).not.toHaveBeenCalled();await c.load();http.expectNone(base+'/Unit/unit-a');f.destroy();
 });
 it('prevents ungranted inspection and posts a supervisor action using the loaded version',async()=>{
   const {f,c,load,api}=await detail({unit:true,inspect:true});
   http.expectOne(base+'/Unit/unit-a').flush(blob(unit()));await load.calls.mostRecent().returnValue;
   c.selectAction('Discard');expect(c.action()).toBeNull();
   c.selectAction('Inspect');c.reason='fixture observation';
   spyOn(window,'confirm').and.returnValue(true);
   const action=spyOn(api,'action').and.callThrough();const task=c.apply();const req=http.expectOne(base+'/Inspect');
   expect(req.request.body.guid).toBe('unit-a');expect(req.request.body.version).toBe('AQID');
   req.flush(null,{status:204,statusText:'No Content'});await action.calls.mostRecent().returnValue;
   http.expectOne(base+'/Unit/unit-a').flush(blob(unit('unit-a','Available')));await task;
   expect(c.detail()?.unit.status).toBe('Available');expect(c.success()).not.toBeNull();f.destroy();
 });
 it('discards obsolete unit responses after route reuse and hides data on role invalidation',async()=>{
   const {f,c,load}=await detail({unit:true});const old=http.expectOne(base+'/Unit/unit-a');const first=load.calls.mostRecent().returnValue;
   params.next(convertToParamMap({guid:'unit-b'}));const next=http.expectOne(base+'/Unit/unit-b');const second=load.calls.mostRecent().returnValue;
   next.flush(blob(unit('unit-b')));await second;old.flush(blob(unit()));await first;
   expect(c.detail()?.unit.guid).toBe('unit-b');current=false;f.detectChanges();expect(f.nativeElement.textContent).not.toContain('FIXTURE-unit-b');
   const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();f.destroy();
 });
 it('keeps only the latest selected request and refuses reserve without an accepted test',async()=>{
   const {f,c,load}=await detail({unit:true,reserve:true,test:true},{bankQueue:true,bankDetail:true});
   http.expectOne(base+'/Unit/unit-a').flush(blob(unit('unit-a','Available')));await load.calls.mostRecent().returnValue;
   const first=c.choose('request-a');const old=http.expectOne(requests+'/Bank/request-a');const second=c.choose('request-b');const next=http.expectOne(requests+'/Bank/request-b');
   next.flush(blob(request('request-b')));await second;old.flush(blob(request('request-a')));await first;
   expect(c.request()?.request.guid).toBe('request-b');expect(c.canLab()).toBeTrue();expect(c.actionEnabled('Reserve')).toBeFalse();f.destroy();
 });
});
