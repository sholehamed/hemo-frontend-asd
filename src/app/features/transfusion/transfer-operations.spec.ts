import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { TransfusionService } from '../../core/api/transfusion.service';
import { TransferPageAccess } from './transfer-page-access';
import { TransferDispatchComponent } from './transfer-dispatch.component';
import { TransferDetailComponent } from './transfer-detail.component';
import { TransferDetail,TransferStatus,Candidate } from './transfer-model';

describe('R02 scoped transfer operations',()=>{
 let current:boolean,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>,query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/Transfusion';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const candidate:Candidate={unitGuid:'unit-a',unitVersion:'AQID',unitCode:'UNIT-A',productCode:'RBC',bloodGroup:'O+',expiresAt:'2026-01-04T00:00:00Z',requestGuid:'request-a',requestNumber:'REQ-A',patientName:'Fixture Patient',hisNumber:'TEST',ward:'Ward',wristbandCode:'BAND-A'};
 const page={data:[candidate],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 const record=(guid='transfer-a',status:TransferStatus='Verified'):TransferDetail=>({transfer:{guid,transferNumber:'TX-A',unitGuid:'unit-a',requestGuid:'request-a',admissionGuid:'admission-a',patientName:'Fixture '+guid,hisNumber:'TEST',ward:'Ward',unitCode:'UNIT-A',productCode:'RBC',bloodGroup:'O+',status,dispatchedAt:'2026-01-01T00:00:00Z',receivedAt:null,startedAt:null,endedAt:null,suspectedReaction:false,version:'BAUG',volumeMl:null},wristbandCode:'BAND-A',requestNumber:'REQ-A',labReportReference:'LAB-A',labRecordedAt:'2026-01-01T00:00:00Z',expiresAt:'2026-01-04T00:00:00Z',carrierName:'Fixture',carrierCode:'C-A',containerCode:'BOX-A',dispatchTemperature:4,transportIndicator:'Fixture',packCount:null,verifiedBy:'nurse-a',witnessedBy:null,startedBy:null,admissionChanged:false,canProceed:true,demo:true,events:[],vitals:[]});
 beforeEach(()=>{
   current=true;params=new BehaviorSubject(convertToParamMap({guid:'transfer-a'}));query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),queryParamMap:query.asObservable(),snapshot:{data:{},get paramMap(){return params.value;},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function dispatch(caps:Record<string,boolean>){
   const f=TestBed.createComponent(TransferDispatchComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(TransferPageAccess),'load').and.callThrough();const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load};
 }
 async function detail(caps:Record<string,boolean|string>){
   const f=TestBed.createComponent(TransferDetailComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(TransferPageAccess),'load').and.callThrough();const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load,api:f.debugElement.injector.get(TransfusionService)};
 }
 it('denies dispatch without all three capabilities',async()=>{
   const {f,c,load}=await dispatch({candidates:true,dispatch:true});expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.save();http.expectNone(base+'/Dispatch');f.destroy();
 });
 it('validates observed identifiers and posts one versioned dispatch even when navigation fails',async()=>{
   const {f,c,load}=await dispatch({candidates:true,dispatch:true,detail:true});
   http.expectOne(base+'/Candidates').flush(blob(page));await load.calls.mostRecent().returnValue;
   c.choose(candidate);c.form={unitCode:'wrong',wristbandCode:'BAND-A',carrierName:'Fixture',carrierCode:'C-A',containerCode:'BOX-A',temperature:4,transportIndicator:'fixture',packCount:null,notes:'fixture'};c.flags=c.checks.map(()=>true);
   await c.save();http.expectNone(base+'/Dispatch');c.form.unitCode='UNIT-A';
   spyOn(window,'confirm').and.returnValue(true);const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(false);
   const task=c.save();const req=http.expectOne(base+'/Dispatch');expect(req.request.body.unitVersion).toBe('AQID');expect(req.request.body.checks).toBe(31);req.flush(blob('transfer-a'));await task;
   expect(nav).toHaveBeenCalledWith(['/hemo/transfusion/detail','transfer-a']);expect(c.savedGuid()).toBe('transfer-a');
   await c.save();http.expectNone(base+'/Dispatch');f.destroy();
 });
 it('clears old candidate selection on query reuse and discards obsolete list',async()=>{
   const {f,c,load}=await dispatch({candidates:true,dispatch:true,detail:true});
   const old=http.expectOne(base+'/Candidates'),first=load.calls.mostRecent().returnValue;
   query.next(convertToParamMap({request:'request-b'}));const next=http.expectOne(base+'/Candidates'),second=load.calls.mostRecent().returnValue;expect(next.request.body.requestGuid).toBe('request-b');
   next.flush(blob({...page,data:[]}));await second;old.flush(blob(page));await first;c.choose(candidate);expect(c.selected()).toBeNull();f.destroy();
 });
 it('does not allow the first verifier to act as witness',async()=>{
   const {f,c,load}=await detail({detail:true,witness:true,userGuid:'nurse-a'});
   http.expectOne(base+'/Detail/transfer-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   c.select('Witness');expect(c.action()).toBeNull();await c.apply();http.expectNone(base+'/Witness');f.destroy();
 });
 it('posts independent witness with loaded record version and refreshes',async()=>{
   const {f,c,load,api}=await detail({detail:true,witness:true,userGuid:'nurse-b'});
   http.expectOne(base+'/Detail/transfer-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   c.select('Witness');c.form.unitCode='UNIT-A';c.form.wristbandCode='BAND-A';c.form.notes='fixture';c.flags=c.checks.map(()=>true);spyOn(window,'confirm').and.returnValue(true);
   const action=spyOn(api,'action').and.callThrough();const task=c.apply();const req=http.expectOne(base+'/Witness');expect(req.request.body.version).toBe('BAUG');expect(req.request.body.guid).toBe('transfer-a');req.flush(null,{status:204,statusText:'No Content'});await action.calls.mostRecent().returnValue;
   http.expectOne(base+'/Detail/transfer-a').flush(blob(record('transfer-a','Witnessed')));await task;expect(c.detail()?.transfer.status).toBe('Witnessed');expect(c.success()).not.toBeNull();f.destroy();
 });
 it('records authorized vital observations with current version and clears after confirmation',async()=>{
   const {f,c,load,api}=await detail({detail:true,vital:true,userGuid:'nurse-a'});
   http.expectOne(base+'/Detail/transfer-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   c.vital={phase:'T0',systolic:120,diastolic:80,pulse:75,temperature:36.8,spo2:98,respiration:16,urineMl:null,rateMlPerHour:null,notes:'fixture'};
   const vital=spyOn(api,'vital').and.callThrough();const task=c.saveVital();const req=http.expectOne(base+'/Vital');expect(req.request.body.version).toBe('BAUG');expect(req.request.body.phase).toBe('T0');req.flush(blob('vital-a'));await vital.calls.mostRecent().returnValue;
   http.expectOne(base+'/Detail/transfer-a').flush(blob(record()));await task;expect(c.vital.phase).toBe('');f.destroy();
 });
 it('discards stale detail responses after route reuse and blocks printing on role change',async()=>{
   const {f,c,load}=await detail({detail:true});
   const old=http.expectOne(base+'/Detail/transfer-a'),first=load.calls.mostRecent().returnValue;
   params.next(convertToParamMap({guid:'transfer-b'}));const next=http.expectOne(base+'/Detail/transfer-b'),second=load.calls.mostRecent().returnValue;
   next.flush(blob(record('transfer-b')));await second;old.flush(blob(record()));await first;expect(c.detail()?.transfer.guid).toBe('transfer-b');
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture transfer-b');f.destroy();
 });
});
