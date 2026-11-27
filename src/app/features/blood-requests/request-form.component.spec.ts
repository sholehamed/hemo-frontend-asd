import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestPageAccess } from './request-page-access';
import { AdmissionPageAccess } from '../admission/admission-page-access';
import { RequestFormComponent } from './request-form.component';
import { blankClinical,RequestDetail } from './blood-request-model';

describe('R02 company request forms',()=>{
 let current:boolean,http:HttpTestingController,source:'Nurse'|'Doctor',params:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const requests='https://fixture.invalid/Identity/BloodRequest';
 const admissions='https://fixture.invalid/Identity/PatientAdmission';
 const blob=(x:unknown)=>new Blob([JSON.stringify(x)],{type:'application/json'});
 const admission=(guid:string)=>({guid,firstName:'Fixture',lastName:guid,hisNumber:'TEST',identityStatus:'Verified',status:'Active',diagnosis:'Diagnosis '+guid,transfusionHistory:'Unknown',alloantibody:false});
 const detail=(guid:string,owned=true):RequestDetail=>({
   request:{guid,requestNumber:'REQ-'+guid,patientAdmissionGuid:'patient-a',patientName:'Fixture',hisNumber:'TEST',ward:'Ward',source:'Nurse',formType:'General',priority:'Routine',status:'Draft',created:'2026-01-01',submittedAt:null,totalUnits:1,owned},
   clientRequestId:'fixture-key',version:'AQID',bloodGroup:null,identityStatus:'Verified',bedNumber:'1',items:[],clinical:blankClinical(),history:[],admissionChanged:false
 });
 beforeEach(()=>{
   current=true;source='Nurse';params=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),snapshot:{get data(){return {source};},get paramMap(){return params.value;},queryParamMap:convertToParamMap({})}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function start(caps:Record<string,boolean>,admissionCaps:Record<string,boolean>={list:true,detail:true},mode:'Nurse'|'Doctor'='Nurse',guid?:string){
   source=mode;if(guid)params.next(convertToParamMap({guid}));
   const f=TestBed.createComponent(RequestFormComponent);
   const access=spyOn(f.debugElement.injector.get(RequestPageAccess),'load').and.callThrough();
   const admissionAccess=spyOn(f.debugElement.injector.get(AdmissionPageAccess),'load').and.callThrough();
   const edit=spyOn(f.componentInstance,'loadEdit').and.callThrough();
   f.detectChanges();
   http.expectOne(requests+'/Capabilities').flush(blob(caps));
   http.expectOne(admissions+'/Capabilities').flush(blob(admissionCaps));
   await Promise.all([access.calls.mostRecent().returnValue,admissionAccess.calls.mostRecent().returnValue]);
   return {f,c:f.componentInstance,edit,api:f.debugElement.injector.get(BloodRequestsService)};
 }
 async function select(c:RequestFormComponent,guid='patient-a'){
   const task=c.selectPatient(guid);http.expectOne(admissions+'/'+guid).flush(blob(admission(guid)));await task;
 }
 it('fails closed when admission detail permission is missing',async()=>{
   const {f,c}=await start({detail:true,nurseCreate:true},{list:true});
   expect(c.allowed()).toBeFalse();await c.selectPatient('patient-a');await c.save(false);
   http.expectNone(admissions+'/patient-a');http.expectNone(requests+'/Nurse');f.destroy();
 });
 it('creates a nurse draft via the company transport and opens its detail',async()=>{
   const {f,c}=await start({detail:true,nurseCreate:true});await select(c);
   const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   c.chooseForm('RBC');const task=c.save(false);const req=http.expectOne(requests+'/Nurse');
   expect(req.request.method).toBe('POST');expect(req.request.body.patientAdmissionGuid).toBe('patient-a');expect(req.request.body.formType).toBe('RBC');
   expect(req.request.body.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
   req.flush(blob('request-a'));await task;
   expect(nav).toHaveBeenCalledWith(['/hemo/requests/detail','request-a']);expect(c.persistedGuid()).toBe('request-a');
   await c.save(false);http.expectNone(requests+'/Nurse');f.destroy();
 });
 it('uses physician creation only with physician capability and restricts form source',async()=>{
   const {f,c}=await start({detail:true,doctorCreate:true},{list:true,detail:true},'Doctor');await select(c);
   c.chooseForm('RBC');expect(c.draft.formType).toBe('General');
   spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   const task=c.save(false);http.expectOne(requests+'/Doctor').flush(blob('request-a'));await task;
   http.expectNone(requests+'/Nurse');f.destroy();
 });
 it('clears prior patient clinical fields, items and client key on confirmed patient change',async()=>{
   const {f,c}=await start({detail:true,nurseCreate:true});await select(c);
   const key=c.draft.clientRequestId;c.draft.clinical.notes='prior private note';c.chooseForm('RBC');c.sampleDate='1405/09/01';
   spyOn(window,'confirm').and.returnValue(true);await select(c,'patient-b');
   expect(c.draft.clientRequestId).not.toBe(key);expect(c.draft.clinical.notes).toBeNull();expect(c.draft.items).toEqual([]);
   expect(c.sampleDate).toBe('');expect(c.draft.patientAdmissionGuid).toBe('patient-b');f.destroy();
 });
 it('does not reload or navigate after the session changes during a write',async()=>{
   const {f,c}=await start({detail:true,nurseCreate:true});await select(c);
   const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   const task=c.save(false);const req=http.expectOne(requests+'/Nurse');
   current=false;req.flush(blob('request-a'));await task;f.detectChanges();
   expect(nav).not.toHaveBeenCalled();expect(c.persistedGuid()).toBeNull();
   expect(f.nativeElement.textContent).not.toContain('Fixture');f.destroy();
 });
 it('retains the confirmed saved identifier if submission fails and prevents duplicate create',async()=>{
   const {f,c,api}=await start({detail:true,nurseCreate:true,submit:true});await select(c);
   c.chooseForm('RBC');c.draft.clinical.clinicalIndication='Recorded fixture';
   spyOn(window,'confirm').and.returnValue(true);const nav=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   const create=spyOn(api,'create').and.callThrough();const get=spyOn(api,'get').and.callThrough();
   const task=c.save(true);http.expectOne(requests+'/Nurse').flush(blob('request-a'));await create.calls.mostRecent().returnValue;
   http.expectOne(requests+'/request-a').flush(blob(detail('request-a')));await get.calls.mostRecent().returnValue;
   const submit=http.expectOne(requests+'/Submit');expect(submit.request.body).toEqual({guid:'request-a',version:'AQID',action:'Submit'});
   submit.flush(blob({detail:'fixture'}),{status:409,statusText:'Conflict'});await task;
   expect(c.persistedGuid()).toBe('request-a');expect(c.error()).not.toBeNull();expect(nav).not.toHaveBeenCalled();
   await c.save(true);http.expectNone(requests+'/Nurse');f.destroy();
 });
 it('refuses an edit for a request not owned by the current account',async()=>{
   const {f,c,edit}=await start({detail:true,edit:true},{detail:true},'Nurse','request-a');
   http.expectOne(requests+'/request-a').flush(blob(detail('request-a',false)));await edit.calls.mostRecent().returnValue;
   expect(c.ready()).toBeFalse();http.expectNone(admissions+'/patient-a');await c.save(false);http.expectNone(requests);f.destroy();
 });
 it('updates the existing draft with its version rather than creating a second request',async()=>{
   const {f,c,edit}=await start({detail:true,edit:true},{detail:true},'Nurse','request-a');
   // Capture the in-flight get promise using the existing response event, then wait for the follow-up request.
   const req=http.expectOne(requests+'/request-a');req.flush(blob(detail('request-a')));
   // The Blob adapter decodes asynchronously. Await the next event-loop turn until the admission request is enqueued.
   let patientReq:ReturnType<HttpTestingController['match']>=[];
   for(let i=0;i<50&&!patientReq.length;i++){await new Promise<void>(resolve=>setTimeout(resolve,0));patientReq=http.match(admissions+'/patient-a');}
   expect(patientReq.length).toBe(1);patientReq[0].flush(blob(admission('patient-a')));
   await edit.calls.mostRecent().returnValue;expect(c.ready()).toBeTrue();
   spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
   const task=c.save(false);const update=http.expectOne(requests);expect(update.request.method).toBe('PUT');expect(update.request.body.guid).toBe('request-a');expect(update.request.body.version).toBe('AQID');
   update.flush(null,{status:204,statusText:'No Content'});await task;http.expectNone(requests+'/Nurse');f.destroy();
 });
});
