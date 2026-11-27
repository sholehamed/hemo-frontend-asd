import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {API_BASE_URL} from '../../Services/api-client';
import {HemoRoleLifecycle} from '../../core/hemo/hemo-role-lifecycle';
import {DashboardPageAccess} from './dashboard-page-access';
import {HomeComponent} from './home.component';
import {fullWeeks} from './dashboard-model';

describe('R02 company role dashboard',()=>{
 let current:boolean,http:HttpTestingController;
 const base='https://fixture.invalid/Identity/';
 const modules=['PatientAdmission','BloodRequest','BloodBank','Transfusion','Hemovigilance','HemoQuality'];
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 const admission={total:10,active:4,verified:8,mismatch:1,ready:2,wards:[],bloodGroups:[]};
 const bank={total:10,available:4,reserved:1,thawing:0,ready:1,hold:2,expired:1,expiringSoon:2,discarded:0,approvedRequests:1,temperatureConcerns:1,stock:[],equipmentBlocked:1};
 const requests={total:7,draft:1,awaitingDoctor:2,returned:1,awaitingBank:1,rejected:1,cancelled:1};
 const transfer={total:10,dispatched:1,received:1,verified:1,inProgress:1,completed:2,receiptHold:1,stopped:1,returning:1};
 const hv={total:4,open:2,pendingDoctor:1,pendingBank:1,rcaOpen:1,capaOpen:2,capaOverdue:1,externalPending:1,startedTransfers:7};
 const equipment={total:4,operational:1,hold:2,serviceDue:1,openIncidents:1,legacyCodes:1};
 const quality={qcRecords:2,qcAwaitingReview:1,committeeMeetings:1,openResolutions:1,overdueResolutions:0,audits:1,trainingCourses:1,products:[{completed:3}]};
 beforeEach(()=>{
  current=true;TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
    {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
    {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}]});
  http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function open(caps:Record<string,unknown>,failed:string[]=[]){
   const f=TestBed.createComponent(HomeComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(DashboardPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();
   for(const module of modules){const req=http.expectOne(base+module+'/Capabilities');if(failed.includes(module))req.flush(blob({}),{status:403,statusText:'Forbidden'});else req.flush(blob(caps[module]??{}));}
   await access.calls.mostRecent().returnValue;
   return {f,c,load,task:load.calls.mostRecent().returnValue};
 }
 function stats(module:string,data:unknown,suffix='Stats'){const req=http.expectOne(base+module+'/'+suffix);expect(req.request.method).toBe('POST');req.flush(blob(data));}
 it('loads seven aggregates for manager and never requests individual rows',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true},BloodRequest:{stats:true},BloodBank:{stats:true},Transfusion:{stats:true},Hemovigilance:{stats:true},HemoQuality:{permissions:{equipmentStats:true,stats:true}}});
   stats('PatientAdmission',admission);stats('BloodRequest',requests);stats('BloodBank',bank);stats('Transfusion',transfer);stats('Hemovigilance',hv);stats('HemoQuality',equipment,'EquipmentStats');stats('HemoQuality',quality);
   await task;expect(c.sections().map(s=>s.id)).toEqual(['admission','requests','bank','transfer','hv','equipment','quality']);expect(c.sections().flatMap(s=>s.metrics).every(m=>!m.link)).toBeTrue();expect(c.visibleQuickLinks()).toEqual([]);
   http.expectNone(r=>/BindPaging|Inventory|Detail|Candidates/.test(r.url));f.destroy();
 });
 it('fails closed on capability error and isolates aggregate request errors',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true},BloodBank:{stats:true},Hemovigilance:{stats:true}},['Hemovigilance']);
   http.expectOne(base+'PatientAdmission/Stats').flush(blob({}),{status:500,statusText:'Error'});stats('BloodBank',bank);await task;
   expect(c.auth.errors()).toContain('هموویژیلانس');http.expectNone(base+'Hemovigilance/Stats');expect(c.sections().find(s=>s.id==='admission')?.metrics).toEqual([]);expect(c.sections().find(s=>s.id==='admission')?.error).toBeTruthy();expect(c.sections().find(s=>s.id==='bank')?.metrics[0].value).toBe(4);f.destroy();
 });
 it('requests own nurse stats and exposes only checked page permissions',async()=>{
   const {f,c,task}=await open({BloodRequest:{stats:true,list:true,nurseCreate:true}});
   const req=http.expectOne(base+'BloodRequest/Stats');expect(req.request.body).toEqual({mine:true});req.flush(blob(requests));await task;
   expect(c.visibleQuickLinks()).toEqual([]);const check=c.checkLinks();const checks=http.match(base+'RoleAccess/CheckPagePermission');expect(checks.length).toBe(1);expect(checks[0].request.body).toEqual({Menu:'/hemo/requests'});checks[0].flush(blob(true));await check;
   expect(c.canNavigate('/hemo/requests')).toBeTrue();expect(c.canNavigate('/hemo/requests/new')).toBeFalse();expect(c.sections()[0].metrics.find(m=>m.link)?.link?.query?.['mine']).toBe('true');f.destroy();
 });
 it('does not treat truthy nonboolean capability or menu response as a grant',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true,list:true},BloodBank:{stats:'true'}});
   stats('PatientAdmission',admission);await task;http.expectNone(base+'BloodBank/Stats');const check=c.checkLinks();
   const checks=http.match(base+'RoleAccess/CheckPagePermission');expect(checks.length).toBe(2);
   for(const req of checks)req.flush(blob(req.request.body.Menu==='/admission/stats'?true:'true'));
   await check;expect(c.canNavigate('/admission/stats')).toBeTrue();expect(c.canNavigate('/admission/list')).toBeFalse();f.destroy();
 });
 it('compares two complete nonoverlapping UTC weeks only for authorized aggregate APIs',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true}});stats('PatientAdmission',admission);await task;
   const compare=c.compare(),rs=http.match(base+'PatientAdmission/Stats');expect(rs.length).toBe(2);
   const weeks=fullWeeks(new Date());expect(rs[0].request.body).toEqual({from:weeks.current.fromDate,to:weeks.current.toDate});expect(rs[1].request.body).toEqual({from:weeks.previous.fromDate,to:weeks.previous.toDate});
   rs[0].flush(blob({...admission,total:7}));rs[1].flush(blob({...admission,total:4}));await compare;expect(c.trends()[0]).toEqual({label:'پذیرش‌ها',current:7,previous:4});f.destroy();
 });
 it('discards in-flight aggregate data after a role change and hides prior UI',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true}});const req=http.expectOne(base+'PatientAdmission/Stats');current=false;req.flush(blob(admission));await task;
   expect(c.sections()).toEqual([]);expect(c.updated()).toBeNull();expect(c.canCompare()).toBeFalse();f.detectChanges();expect(f.nativeElement.querySelector('[data-module]')).toBeNull();f.destroy();
 });
 it('invalidates previously checked links and stale comparison when refreshed',async()=>{
   const {f,c,task}=await open({PatientAdmission:{stats:true}});stats('PatientAdmission',admission);await task;
   const check=c.checkLinks();http.expectOne(base+'RoleAccess/CheckPagePermission').flush(blob(true));await check;expect(c.canNavigate('/admission/stats')).toBeTrue();
   const compare=c.compare(),old=http.match(base+'PatientAdmission/Stats');const refresh=c.load();expect(c.canNavigate('/admission/stats')).toBeFalse();
   const access=f.debugElement.injector.get(DashboardPageAccess);
   for(const module of modules)http.expectOne(base+module+'/Capabilities').flush(blob({}));
   await (access.load as jasmine.Spy).calls.mostRecent().returnValue;await refresh;
   for(const req of old)req.flush(blob(admission));await compare;expect(c.trends()).toEqual([]);expect(c.sections()).toEqual([]);f.destroy();
 });
});
