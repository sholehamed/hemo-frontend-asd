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
import {QualityDetailComponent} from './quality-detail.component';
import {QualityListComponent} from './quality-list.component';
import {FacilityComponent} from './facility.component';
import {QualityKind,QualityDetail,QualityLine,Facility} from './quality-model';
describe('R02 scoped quality operations',()=>{
 let current:boolean,kind:QualityKind,userGuid:string,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/HemoQuality';
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 const line:QualityLine={guid:'line-a',title:'Resolution',data:{indicator:'Fixture'},status:'Submitted',ownerUserGuid:'owner-a',dueAt:'2026-01-10T00:00:00Z',progress:100,evidence:'Fixture',verifiedBy:null,verifiedAt:null,version:'BAUG'};
 const detail=(status='Draft',lines:QualityLine[]=[],guid='record-a'):QualityDetail=>({record:{guid,kind,number:'FIXTURE-A',title:'Fixture record',ward:'Ward',status,occurredAt:'2026-01-01T00:00:00Z',createdByUserGuid:'creator-a',reviewedAt:null,version:'AQID',demo:true},header:{},lines,events:[],reviewNotes:null,reviewedBy:null,auditScore:null,auditMaximum:null});
 const facility:Facility={facilityName:'Fixture facility',accreditationCode:null,chair:null,secretary:null,officer:null,bloodCenter:null,bloodCenterCode:null,reportFooter:null,version:'AQID'};
 beforeEach(()=>{
   current=true;kind='Qc';userGuid='creator-a';params=new BehaviorSubject(convertToParamMap({guid:'record-a'}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),snapshot:{get data(){return {kind};},get paramMap(){return params.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function open(permissions:Record<string,boolean>,d:QualityDetail=detail()){
   const f=TestBed.createComponent(QualityDetailComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions,userGuid}));await access.calls.mostRecent().returnValue;
   if(c.canOpen()){http.expectOne(base+'/'+kind+'Detail/record-a').flush(blob(d));await load.calls.mostRecent().returnValue;}
   return {f,c,load,api:f.debugElement.injector.get(QualityService)};
 }
 async function openFacility(permissions:Record<string,boolean>){
   const f=TestBed.createComponent(FacilityComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions,userGuid}));await access.calls.mostRecent().returnValue;
   if(permissions['facility']){http.expectOne(base+'/Facility').flush(blob(facility));await load.calls.mostRecent().returnValue;}
   return {f,c,api:f.debugElement.injector.get(QualityService)};
 }
 it('does not substitute QC permission for audit detail',async()=>{
   kind='Audit';const {f,c}=await open({qcDetail:true});await c.load();http.expectNone(base+'/AuditDetail/record-a');expect(c.detail()).toBeNull();f.destroy();
 });
 it('blocks self-approval even if reviewer capability exists',async()=>{
   const {f,c}=await open({qcDetail:true,qcApprove:true},detail('Submitted'));
   expect(c.actions()).toEqual([]);c.select('Approve');await c.apply();http.expectNone(base+'/QcApprove');f.destroy();
 });
 it('sends independent review with current record version and refreshes',async()=>{
   kind='Audit';userGuid='reviewer-a';const {f,c,api}=await open({auditDetail:true,auditApprove:true},detail('Submitted'));
   expect(c.actions()).toEqual(['Approve','Reject']);c.select('Approve');c.notes='Reviewed';spyOn(window,'confirm').and.returnValue(true);
   const write=spyOn(api,'action').and.callThrough(),task=c.apply();const req=http.expectOne(base+'/AuditApprove');expect(req.request.body).toEqual({guid:'record-a',version:'AQID',notes:'Reviewed'});req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/AuditDetail/record-a').flush(blob(detail('Approved')));await task;expect(c.detail()?.record.status).toBe('Approved');expect(c.success()).not.toBeNull();f.destroy();
 });
 it('requires separate owners permission before opening training line editor',async()=>{
   kind='Training';const {f,c}=await open({trainingDetail:true,trainingLine:true});await c.startLine();http.expectNone(base+'/TrainingOwners');expect(c.editingLine()).toBeFalse();f.destroy();
 });
 it('only accepts server-provided committee owner for a draft resolution',async()=>{
   kind='Committee';const {f,c}=await open({committeeDetail:true,committeeLine:true,committeeOwners:true});
   const task=c.startLine();http.expectOne(base+'/CommitteeOwners').flush(blob([{userGuid:'owner-a',name:'Owner'}]));await task;
   c.line.title='Resolution';c.line.ownerUserGuid='unknown';c.lineData['indicator']='Indicator';await c.saveLine();http.expectNone(base+'/CommitteeLine');expect(c.error()).not.toBeNull();f.destroy();
 });
 it('rejects stale resolution version, blocks premature close and verifies using both current versions',async()=>{
   kind='Committee';userGuid='reviewer-a';const {f,c,api}=await open({committeeDetail:true,committeeVerify:true,committeeClose:true},detail('Approved',[line]));
   expect(c.actions()).not.toContain('Close');expect(c.lineActions({...line,version:'stale'})).toEqual([]);c.selectLine(line,'Verify');c.notes='Evidence checked';c.progress=2;
   spyOn(window,'confirm').and.returnValue(true);const write=spyOn(api,'action').and.callThrough(),task=c.applyLine();const req=http.expectOne(base+'/CommitteeVerify');expect(req.request.body).toEqual({guid:'record-a',version:'AQID',lineGuid:'line-a',lineVersion:'BAUG',progress:100,evidence:'Evidence checked'});req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/CommitteeDetail/record-a').flush(blob(detail('Approved',[{...line,status:'Verified'}])));await task;expect(c.actions()).toContain('Close');f.destroy();
 });
 it('does not allow owner to verify own resolution',async()=>{
   kind='Committee';userGuid='owner-a';const {f,c}=await open({committeeDetail:true,committeeVerify:true},detail('Approved',[line]));
   expect(c.lineActions(line)).toEqual([]);c.selectLine(line,'Verify');await c.applyLine();http.expectNone(base+'/CommitteeVerify');f.destroy();
 });
 it('rejects old detail response and denies print on role change',async()=>{
   const {f,c,load}=await open({qcDetail:true});const first=c.load(),old=http.expectOne(base+'/QcDetail/record-a');params.next(convertToParamMap({guid:'record-b'}));const second=load.calls.mostRecent().returnValue;
   http.expectOne(base+'/QcDetail/record-b').flush(blob(detail('Draft',[],'record-b')));await second;old.flush(blob(detail()));await first;expect(c.detail()?.record.guid).toBe('record-b');
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture record');f.destroy();
 });
 it('retains confirmed QC draft after navigation refusal',async()=>{
   const f=TestBed.createComponent(QualityListComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions:{qcList:true,qcDetail:true,qcCreate:true},userGuid}));await access.calls.mostRecent().returnValue;
   http.expectOne(base+'/QcList').flush(blob({data:[],pageNumber:1,totalCount:0,totalPages:0,hasPreviousPage:false,hasNextPage:false}));await load.calls.mostRecent().returnValue;
   spyOn(window,'confirm').and.returnValue(true);spyOn(TestBed.inject(Router),'navigate').and.resolveTo(false);c.openCreate();c.form.title='QC';c.form.ward='Ward';c.header['shift']='Morning';c.header['operator']='Fixture';
   const task=c.save();const req=http.expectOne(base+'/QcCreate');expect(req.request.body.header.shift).toBe('Morning');req.flush(blob('record-a'));await task;expect(c.savedGuid()).toBe('record-a');await c.save();http.expectNone(base+'/QcCreate');f.destroy();
 });
 it('requires independent facility write permission',async()=>{
   const {f,c}=await openFacility({facility:true});c.notes='Change';await c.save();http.expectNone(base+'/FacilitySave');f.destroy();
 });
 it('saves facility with current version, not history, and refreshes profile',async()=>{
   const {f,c,api}=await openFacility({facility:true,facilitySave:true});c.notes='Update';c.form.facilityName='Updated';spyOn(window,'confirm').and.returnValue(true);
   const write=spyOn(api,'saveFacility').and.callThrough(),task=c.save();const req=http.expectOne(base+'/FacilitySave');expect(req.request.body.version).toBe('AQID');expect(req.request.body.history).toBeUndefined();req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/Facility').flush(blob({...facility,facilityName:'Updated',version:'BAUG'}));await task;expect(c.form.version).toBe('BAUG');expect(c.success()).not.toBeNull();f.destroy();
 });

 it('saves QC line with current record and line versions and typed result',async()=>{
   const existing:QualityLine={...line,status:'Draft',ownerUserGuid:null,dueAt:null,data:{lot:'LOT',manufacturer:'Maker',expiry:'2027-01-01T00:00:00Z',positiveExpected:'Positive',positiveObserved:'Positive',negativeExpected:'Negative',negativeObserved:'Negative',result:'Accepted',notes:'Fixture'}};
   const {f,c,api}=await open({qcDetail:true,qcLine:true},detail('Draft',[existing]));
   await c.startLine(existing);expect(c.editingLine()).toBeTrue();c.lineData['lot']='LOT2';
   const write=spyOn(api,'action').and.callThrough(),task=c.saveLine();const req=http.expectOne(base+'/QcLine');
   expect(req.request.body.guid).toBe('record-a');expect(req.request.body.version).toBe('AQID');expect(req.request.body.lineGuid).toBe('line-a');expect(req.request.body.lineVersion).toBe('BAUG');expect(req.request.body.data.lot).toBe('LOT2');expect(req.request.body.ownerUserGuid).toBeNull();
   req.flush(blob('line-a'));await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/QcDetail/record-a').flush(blob(detail('Draft',[{...existing,data:{...existing.data,lot:'LOT2'}}])));await task;expect(c.success()).not.toBeNull();f.destroy();
 });
 it('submits a committee resolution from its assigned owner at 100 percent for review',async()=>{
   kind='Committee';userGuid='owner-a';const pending={...line,status:'Open',progress:0};
   const {f,c,api}=await open({committeeDetail:true,committeeProgress:true},detail('Approved',[pending]));c.selectLine(pending,'Progress');c.progress=100;c.notes='Completed with evidence';
   spyOn(window,'confirm').and.returnValue(true);const write=spyOn(api,'action').and.callThrough(),task=c.applyLine();const req=http.expectOne(base+'/CommitteeProgress');
   expect(req.request.body.progress).toBe(100);expect(req.request.body.lineVersion).toBe('BAUG');req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/CommitteeDetail/record-a').flush(blob(detail('Approved',[line])));await task;expect(c.detail()?.lines[0].status).toBe('Submitted');expect(c.lineActions(line)).toEqual([]);f.destroy();
 });
 it('does not create a training draft with a QC create grant',async()=>{
   kind='Training';const f=TestBed.createComponent(QualityListComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(QualityPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({permissions:{trainingList:true,trainingDetail:true,qcCreate:true},userGuid}));await access.calls.mostRecent().returnValue;
   http.expectOne(base+'/TrainingList').flush(blob({data:[],pageNumber:1,totalCount:0,totalPages:0,hasPreviousPage:false,hasNextPage:false}));await load.calls.mostRecent().returnValue;
   expect(c.canCreate()).toBeFalse();c.openCreate();await c.save();http.expectNone(base+'/TrainingCreate');f.destroy();
 });
});
