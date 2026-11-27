import { TestBed } from '@angular/core/testing';
import { ActivatedRoute,convertToParamMap,provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { HvDashboardComponent } from './hv-dashboard.component';
import { HvListComponent } from './hv-list.component';
import { HvPageAccess } from './hv-page-access';
import { CaseRow,Summary } from './hv-model';

describe('R02 scoped hemovigilance reads',()=>{
 let current:boolean,mode:string,http:HttpTestingController;
 let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/Hemovigilance';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const summary:Summary={total:2,open:1,closed:1,pendingDoctor:1,pendingBank:0,rcaOpen:0,capaMonitoring:0,capaOpen:0,capaOverdue:0,externalPending:0,startedTransfers:4,byDiagnosis:[],bySeverity:[],byWard:[],byProduct:[],byStatus:[]};
 const row:CaseRow={guid:'case-a',caseNumber:'FIXTURE-001',transferGuid:'transfer-a',transferNumber:'TX-A',patientName:'Fixture Patient',hisNumber:'TEST',ward:'Ward',productCode:'RBC',unitCode:'FIXTURE-UNIT',status:'Reported',onsetAt:'2026-01-01T10:00:00Z',reportedAt:'2026-01-01T10:05:00Z',initialSeverity:'Unknown',diagnosisCode:null,severity:null,imputability:null,outcome:null,demo:true,version:'AQID'};
 const page={data:[row],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 beforeEach(()=>{
   current=true;mode='cases';query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {mode};},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function dashboard(caps:Record<string,boolean>){
   const f=TestBed.createComponent(HvDashboardComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(HvPageAccess),'load').and.callThrough();
   const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load};
 }
 async function list(caps:Record<string,boolean>){
   const f=TestBed.createComponent(HvListComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(HvPageAccess),'load').and.callThrough();
   const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load};
 }
 it('does not retrieve patient records for aggregate-only access',async()=>{
   const {f,c,load}=await dashboard({stats:true});
   http.expectOne(base+'/Stats').flush(blob(summary));await load.calls.mostRecent().returnValue;
   http.expectNone(base+'/List');f.detectChanges();expect(c.summary()?.total).toBe(2);expect(f.nativeElement.textContent).not.toContain('پرونده‌های باز اخیر');f.destroy();
 });
 it('preserves aggregate results when the recent list fails',async()=>{
   const {f,c,load}=await dashboard({stats:true,list:true});
   http.expectOne(base+'/Stats').flush(blob(summary));const req=http.expectOne(base+'/List');expect(req.request.body.status).toBe('Open');
   req.flush(blob({detail:'fixture'}),{status:500,statusText:'Error'});await load.calls.mostRecent().returnValue;
   expect(c.summary()?.total).toBe(2);expect(c.recentError()).not.toBeNull();f.destroy();
 });
 it('denies doctor queue without doctor capability',async()=>{
   mode='doctor';const {f,c,load}=await list({list:true,bankReview:true});
   expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.load();http.expectNone(base+'/List');f.destroy();
 });
 it('keeps the doctor queue fixed despite URL status and reset',async()=>{
   mode='doctor';query.next(convertToParamMap({status:'Closed'}));
   const {f,c,load}=await list({list:true,doctorReview:true});
   let req=http.expectOne(base+'/List');expect(req.request.body.status).toBe('Reported');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.reset();req=http.expectOne(base+'/List');expect(req.request.body.status).toBe('Reported');req.flush(blob(page));await load.calls.mostRecent().returnValue;f.destroy();
 });
 it('keeps CAPA assignee filter on for progress-only role',async()=>{
   mode='capa';const {f,c,load}=await list({list:true,capaProgress:true});
   let req=http.expectOne(base+'/List');expect(req.request.body.mineCapa).toBeTrue();expect(req.request.body.status).toBe('CapaMonitoring');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.mineCapa=false;c.reset();req=http.expectOne(base+'/List');expect(req.request.body.mineCapa).toBeTrue();req.flush(blob(page));await load.calls.mostRecent().returnValue;f.destroy();
 });
 it('allows the independent reviewer to see CAPA review queue without assignment filter',async()=>{
   mode='capa';const {f,c,load}=await list({list:true,capaVerify:true,close:true});
   const req=http.expectOne(base+'/List');expect(req.request.body.mineCapa).toBeFalse();expect(req.request.body.status).toBe('CapaMonitoring');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   expect(c.ownerOnly()).toBeFalse();f.destroy();
 });
 it('discards obsolete transfer-filtered response and prevents print after scope changes',async()=>{
   query.next(convertToParamMap({transfer:'transfer-a'}));
   const {f,c,load}=await list({list:true});
   const old=http.expectOne(base+'/List'),first=load.calls.mostRecent().returnValue;
   query.next(convertToParamMap({transfer:'transfer-b'}));const next=http.expectOne(base+'/List'),second=load.calls.mostRecent().returnValue;
   expect(next.request.body.transferGuid).toBe('transfer-b');next.flush(blob({...page,data:[],totalCount:0}));await second;
   old.flush(blob(page));await first;expect(c.page()?.totalCount).toBe(0);
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture Patient');f.destroy();
 });
});
