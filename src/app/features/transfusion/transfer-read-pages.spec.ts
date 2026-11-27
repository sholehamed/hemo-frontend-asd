import { TestBed } from '@angular/core/testing';
import { ActivatedRoute,convertToParamMap,provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { TransferDashboardComponent } from './transfer-dashboard.component';
import { TransferListComponent } from './transfer-list.component';
import { TransferPageAccess } from './transfer-page-access';

describe('R02 scoped transfer reads',()=>{
 let current:boolean,mode:string,http:HttpTestingController;
 let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/Transfusion';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const stats={total:2,dispatched:1,received:1,receiptHold:0,verified:0,witnessed:0,inProgress:0,completed:0,stopped:0,returning:0,returned:0,disposed:0,suspectedReactions:0};
 const row={guid:'transfer-a',transferNumber:'FIXTURE-001',unitGuid:'unit-a',requestGuid:'request-a',admissionGuid:'admission-a',patientName:'Fixture Patient',hisNumber:'TEST',ward:'Ward',unitCode:'FIXTURE-UNIT',productCode:'RBC',bloodGroup:'O+',status:'Received',dispatchedAt:'2026-01-01T10:00:00Z',receivedAt:null,startedAt:null,endedAt:null,suspectedReaction:false,version:'AQID',volumeMl:null};
 const page={data:[row],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 beforeEach(()=>{
   current=true;mode='tasks';query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {mode};},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function dashboard(caps:Record<string,boolean>){
   const f=TestBed.createComponent(TransferDashboardComponent);
   const access=spyOn(f.debugElement.injector.get(TransferPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c:f.componentInstance,load};
 }
 async function list(caps:Record<string,boolean>){
   const f=TestBed.createComponent(TransferListComponent);
   const access=spyOn(f.debugElement.injector.get(TransferPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c:f.componentInstance,load};
 }
 it('does not read patient list for aggregate-only permission',async()=>{
   const {f,c,load}=await dashboard({stats:true});
   http.expectOne(base+'/Stats').flush(blob(stats));await load.calls.mostRecent().returnValue;f.detectChanges();
   http.expectNone(base+'/List');expect(c.stats()?.total).toBe(2);expect(f.nativeElement.textContent).not.toContain('حواله‌های اخیر');f.destroy();
 });
 it('keeps valid statistics after the recent list fails',async()=>{
   const {f,c,load}=await dashboard({stats:true,list:true});
   http.expectOne(base+'/Stats').flush(blob(stats));http.expectOne(base+'/List').flush(blob({detail:'fixture'}),{status:500,statusText:'Error'});
   await load.calls.mostRecent().returnValue;expect(c.stats()?.total).toBe(2);expect(c.recentError()).not.toBeNull();f.destroy();
 });
 it('denies physician monitoring without physician permission',async()=>{
   mode='monitoring';const {f,c,load}=await list({list:true,vital:true});
   expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.load();http.expectNone(base+'/List');f.destroy();
 });
 it('forces the return queue despite query and reset',async()=>{
   mode='returns';query.next(convertToParamMap({status:'Completed'}));
   const {f,c,load}=await list({list:true,acceptReturn:true});
   let req=http.expectOne(base+'/List');expect(req.request.body.status).toBe('ReturnQueue');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.reset();req=http.expectOne(base+'/List');expect(req.request.body.status).toBe('ReturnQueue');req.flush(blob(page));await load.calls.mostRecent().returnValue;f.destroy();
 });
 it('forces the active vital queue and preserves applied filters across pagination',async()=>{
   mode='vitals';query.next(convertToParamMap({admission:'admission-a',status:'Completed'}));
   const {f,c,load}=await list({list:true,vital:true});
   const first=http.expectOne(base+'/List');expect(first.request.body.status).toBe('Active');expect(first.request.body.admissionGuid).toBe('admission-a');first.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.search='unapplied';const task=c.load(2);const next=http.expectOne(base+'/List');expect(next.request.body.search).toBe('');expect(next.request.body.pageNumber).toBe(2);next.flush(blob(page));await task;f.destroy();
 });
 it('discards obsolete patient query responses and blocks exports after role invalidation',async()=>{
   query.next(convertToParamMap({request:'request-a'}));
   const {f,c,load}=await list({list:true,detail:true});
   const old=http.expectOne(base+'/List'),first=load.calls.mostRecent().returnValue;
   query.next(convertToParamMap({request:'request-b'}));const next=http.expectOne(base+'/List'),second=load.calls.mostRecent().returnValue;expect(next.request.body.requestGuid).toBe('request-b');
   next.flush(blob({...page,data:[],totalCount:0}));await second;old.flush(blob(page));await first;expect(c.page()?.totalCount).toBe(0);
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture Patient');f.destroy();
 });
});
