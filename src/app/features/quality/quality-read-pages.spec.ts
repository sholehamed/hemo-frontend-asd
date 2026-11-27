import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,convertToParamMap,provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {BehaviorSubject} from 'rxjs';
import {API_BASE_URL} from '../../Services/api-client';
import {HemoRoleLifecycle} from '../../core/hemo/hemo-role-lifecycle';
import {QualityPageAccess} from './quality-page-access';
import {EquipmentListComponent} from './equipment-list.component';
import {EquipmentDashboardComponent} from './equipment-dashboard.component';
import {EquipmentIncidentsComponent} from './equipment-incidents.component';
import {QualityListComponent} from './quality-list.component';
import {QualityDashboardComponent} from './quality-dashboard.component';
import {EquipmentRow,EquipmentSummary,QualityStats} from './quality-model';

describe('R02 scoped quality reads',()=>{
 let current:boolean,mode:string,kind:string,http:HttpTestingController;
 let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/HemoQuality';
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 const row:EquipmentRow={guid:'eq-a',code:'EQ-A',name:'Fixture equipment',category:'Refrigerator',brandModel:'Fixture',ward:'Ward',serialNumber:null,status:'Hold',calibrationAt:null,calibrationDueAt:null,maintenanceDueAt:null,version:'AQID'};
 const page={data:[row],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 const empty={...page,data:[],totalCount:0};
 const eqSummary:EquipmentSummary={total:2,operational:1,hold:1,archived:0,serviceDue:1,openIncidents:1,legacyCodes:1,unregisteredCodes:['LEGACY']};
 const stats:QualityStats={qcRecords:2,qcAwaitingReview:1,committeeMeetings:0,openResolutions:0,overdueResolutions:0,audits:0,trainingCourses:0,attendanceRecords:0,present:0,equipmentIncidents:0,reactionCases:0,products:[],completedByWard:[]};
 beforeEach(()=>{
   current=true;mode='equipment';kind='Qc';query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {mode,kind};},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function start<T extends {load: (...args:any[])=>Promise<void>}>(component:new (...args:any[])=>T,permissions:Record<string,boolean>){
   const f=TestBed.createComponent(component),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough();
   const load=spyOn(c,'load').and.callThrough();f.detectChanges();
   http.expectOne(base+'/Capabilities').flush(blob({permissions,userGuid:'user-a'}));await access.calls.mostRecent().returnValue;
   return {f,c,load};
 }
 it('does not fetch equipment without mode-specific maintenance capability',async()=>{
   mode='maintenance';const {f,c,load}=await start(EquipmentListComponent,{equipmentList:true});
   expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.load();http.expectNone(base+'/EquipmentList');f.destroy();
 });
 it('locks maintenance status to Due regardless of URL and filter edits',async()=>{
   mode='maintenance';query.next(convertToParamMap({status:'Operational'}));
   const {f,c,load}=await start(EquipmentListComponent,{equipmentList:true,equipmentService:true});
   let req=http.expectOne(base+'/EquipmentList');expect(req.request.body.status).toBe('Due');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.statusFilter='Archived';const task=c.load();req=http.expectOne(base+'/EquipmentList');expect(req.request.body.status).toBe('Due');req.flush(blob(page));await task;f.destroy();
 });
 it('discards stale equipment searches and prevents print after session change',async()=>{
   query.next(convertToParamMap({search:'old'}));const {f,c,load}=await start(EquipmentListComponent,{equipmentList:true});
   const old=http.expectOne(base+'/EquipmentList'),first=load.calls.mostRecent().returnValue;
   query.next(convertToParamMap({search:'new'}));const next=http.expectOne(base+'/EquipmentList'),second=load.calls.mostRecent().returnValue;
   expect(next.request.body.search).toBe('new');next.flush(blob(empty));await second;old.flush(blob(page));await first;
   expect(c.page()?.totalCount).toBe(0);current=false;const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();f.destroy();
 });
 it('uses only equipment aggregate endpoint for stats-only role',async()=>{
   const {f,c,load}=await start(EquipmentDashboardComponent,{equipmentStats:true});
   http.expectOne(base+'/EquipmentStats').flush(blob(eqSummary));await load.calls.mostRecent().returnValue;
   http.expectNone(base+'/EquipmentList');expect(c.summary()?.total).toBe(2);f.detectChanges();expect(f.nativeElement.querySelector('a')).toBeNull();f.destroy();
 });
 it('retrieves incidents only for authorized role',async()=>{
   const {f,c,load}=await start(EquipmentIncidentsComponent,{incidents:true});
   const req=http.expectOne(base+'/Incidents');expect(req.request.body.status).toBe('Open');req.flush(blob(empty));await load.calls.mostRecent().returnValue;expect(c.page()?.totalCount).toBe(0);f.destroy();
 });
 it('does not substitute QC permission for audit permission',async()=>{
   kind='Audit';const {f,c,load}=await start(QualityListComponent,{qcList:true});
   expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.load();http.expectNone(base+'/AuditList');f.destroy();
 });
 it('dispatches the correct kind list and denies invalid date filter',async()=>{
   kind='Training';const {f,c,load}=await start(QualityListComponent,{trainingList:true});
   http.expectOne(base+'/TrainingList').flush(blob(empty));await load.calls.mostRecent().returnValue;
   c.fromDate='invalid';await c.load();http.expectNone(base+'/TrainingList');expect(c.error()).not.toBeNull();f.destroy();
 });
 it('does not read facility without its independent permission and labels applied filters',async()=>{
   const {f,c,load}=await start(QualityDashboardComponent,{stats:true});
   const req=http.expectOne(base+'/Stats');expect(req.request.body.ward).toBe('');c.ward='New ward';req.flush(blob(stats));await load.calls.mostRecent().returnValue;
   http.expectNone(base+'/Facility');expect(c.data()?.qcRecords).toBe(2);expect(c.applied).not.toContain('New ward');f.destroy();
 });
});
