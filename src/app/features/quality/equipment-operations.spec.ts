import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,Router,convertToParamMap,provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {BehaviorSubject} from 'rxjs';
import {API_BASE_URL} from '../../Services/api-client';
import {HemoRoleLifecycle} from '../../core/hemo/hemo-role-lifecycle';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {EquipmentDetailComponent} from './equipment-detail.component';
import {EquipmentListComponent} from './equipment-list.component';
import {EquipmentDetail,EquipmentRow,Incident} from './quality-model';

describe('R02 scoped equipment operations',()=>{
 let current:boolean,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>,query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/HemoQuality';
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 const row:EquipmentRow={guid:'eq-a',code:'EQ-A',name:'Fixture equipment',category:'Refrigerator',brandModel:'Fixture model',ward:'Ward A',serialNumber:null,status:'Hold',calibrationAt:null,calibrationDueAt:null,maintenanceDueAt:null,version:'AQID'};
 const incident:Incident={guid:'incident-a',equipmentGuid:'eq-a',code:'EQ-A',equipmentName:'Fixture equipment',incidentNumber:'EQI-A',urgency:'Routine',status:'Open',reportedAt:'2026-01-01T00:00:00Z',description:'Fixture',reporterUserGuid:'tech-a',resolution:null,resolutionReference:null,resolvedAt:null,version:'BAUG',equipmentVersion:'AQID'};
 const detail=(guid='eq-a',incidents:Incident[]=[],storedUnits=0):EquipmentDetail=>({equipment:{...row,guid},events:[],incidents,temperatures:[],storedUnits,demo:true});
 const page={data:[row],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 beforeEach(()=>{
   current=true;params=new BehaviorSubject(convertToParamMap({guid:'eq-a'}));query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),queryParamMap:query.asObservable(),snapshot:{data:{mode:'equipment'},get paramMap(){return params.value;},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function open(permissions:Record<string,boolean>,d:EquipmentDetail=detail()){
   const f=TestBed.createComponent(EquipmentDetailComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions,userGuid:'tech-a'}));await access.calls.mostRecent().returnValue;
   if(permissions['equipmentDetail']){http.expectOne(base+'/EquipmentDetail/eq-a').flush(blob(d));await load.calls.mostRecent().returnValue;}
   return {f,c,load,api:f.debugElement.injector.get(QualityService)};
 }
 async function list(permissions:Record<string,boolean>){
   const f=TestBed.createComponent(EquipmentListComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions,userGuid:'tech-a'}));await access.calls.mostRecent().returnValue;
   if(c.canOpen()){http.expectOne(base+'/EquipmentList').flush(blob(page));await load.calls.mostRecent().returnValue;}
   return {f,c};
 }
 it('does not read details without the separate detail capability',async()=>{
   const {f,c}=await open({equipmentService:true});await c.load();http.expectNone(base+'/EquipmentDetail/eq-a');expect(c.detail()).toBeNull();f.destroy();
 });
 it('does not allow technical operator to release equipment',async()=>{
   const {f,c}=await open({equipmentDetail:true,equipmentService:true});expect(c.actions()).toContain('Service');expect(c.actions()).not.toContain('Release');c.select('Release');expect(c.action()).toBe('');await c.save();http.expectNone(base+'/EquipmentRelease');f.destroy();
 });
 it('does not offer archive or release when incident is open',async()=>{
   const {f,c}=await open({equipmentDetail:true,equipmentArchive:true,equipmentRelease:true},detail('eq-a',[incident],1));expect(c.actions()).not.toContain('Release');expect(c.actions()).not.toContain('Archive');f.destroy();
 });
 it('requires documented due date for accepted calibration',async()=>{
   const {f,c}=await open({equipmentDetail:true,equipmentService:true});c.select('Service');c.form.kind='Calibration';c.form.result='Accepted';c.form.notes='Fixture';c.form.provider='Fixture';c.form.checks='Fixture';c.form.reference='REF';c.useNow=true;
   await c.save();expect(c.error()).not.toBeNull();http.expectNone(base+'/EquipmentService');f.destroy();
 });
 it('rejects invalid temperature ordering before sending data',async()=>{
   const {f,c}=await open({equipmentDetail:true,equipmentTemperature:true});c.select('Temperature');c.form.notes='Fixture';c.form.shift='Morning';c.form.assessment='Acceptable';c.form.temperature=4;c.form.minimum=5;c.form.maximum=6;c.useNow=true;
   await c.save();expect(c.error()).not.toBeNull();http.expectNone(base+'/EquipmentTemperature');f.destroy();
 });
 it('resolves only the current open incident using both versions',async()=>{
   const {f,c,api}=await open({equipmentDetail:true,incidentResolve:true},detail('eq-a',[incident]));
   c.select('IncidentResolve',{...incident,version:'stale'});expect(c.action()).toBe('');c.select('IncidentResolve',incident);c.form.resolution='Fixed';c.form.reference='REF';
   spyOn(window,'confirm').and.returnValue(true);const write=spyOn(api,'equipmentAction').and.callThrough();const task=c.save();
   const req=http.expectOne(base+'/IncidentResolve');expect(req.request.body).toEqual({guid:'incident-a',version:'BAUG',equipmentVersion:'AQID',resolution:'Fixed',reference:'REF'});req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/EquipmentDetail/eq-a').flush(blob(detail('eq-a',[{...incident,status:'Resolved'}])));await task;expect(c.detail()?.incidents[0].status).toBe('Resolved');expect(c.success()).not.toBeNull();f.destroy();
 });
 it('ignores previous detail and denies print after role invalidation',async()=>{
   const {f,c,load}=await open({equipmentDetail:true});
   const first=c.load();const old=http.expectOne(base+'/EquipmentDetail/eq-a');params.next(convertToParamMap({guid:'eq-b'}));const second=load.calls.mostRecent().returnValue;
   http.expectOne(base+'/EquipmentDetail/eq-b').flush(blob(detail('eq-b')));await second;old.flush(blob(detail()));await first;
   expect(c.detail()?.equipment.guid).toBe('eq-b');current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture equipment');f.destroy();
 });
 it('requires detail capability for registration and confirmed ID is retained after navigation refusal',async()=>{
   const {f,c}=await list({equipmentList:true,equipmentCreate:true,equipmentDetail:true});
   spyOn(window,'confirm').and.returnValue(true);spyOn(TestBed.inject(Router),'navigate').and.resolveTo(false);
   c.openCreate();c.form={code:' EQ-B ',name:'Fixture',category:'Refrigerator',brandModel:'Fixture model',ward:'Ward',serialNumber:''};
   const task=c.save();const req=http.expectOne(base+'/EquipmentCreate');expect(req.request.body.code).toBe('EQ-B');expect(req.request.body.serialNumber).toBeNull();req.flush(blob('eq-b'));await task;expect(c.savedGuid()).toBe('eq-b');await c.save();http.expectNone(base+'/EquipmentCreate');f.destroy();
 });
});
