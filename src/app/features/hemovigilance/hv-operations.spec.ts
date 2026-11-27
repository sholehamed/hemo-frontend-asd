import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,Router,convertToParamMap,provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {BehaviorSubject} from 'rxjs';
import {API_BASE_URL} from '../../Services/api-client';
import {HemoRoleLifecycle} from '../../core/hemo/hemo-role-lifecycle';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {HvPageAccess} from './hv-page-access';
import {HvCreateComponent} from './hv-create.component';
import {HvDetailComponent} from './hv-detail.component';
import {Candidate,HvDetail,CapaView,HvStatus} from './hv-model';

describe('R02 scoped hemovigilance operations',()=>{
 let current:boolean,http:HttpTestingController;
 let params:BehaviorSubject<ReturnType<typeof convertToParamMap>>,query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/Hemovigilance';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const candidate:Candidate={guid:'tx-a',transferNumber:'TX-A',patientName:'Fixture Patient',hisNumber:'TEST',ward:'Ward',productCode:'RBC',unitCode:'UNIT-A',status:'InProgress',startedAt:'2026-01-01T00:00:00Z',endedAt:null,suspectedReaction:true,version:'AQID'};
 const page={data:[candidate],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 const action:CapaView={guid:'capa-a',title:'Fixture action',kind:'Corrective',ownerUserGuid:'owner-a',ownerName:'Owner',dueAt:'2026-01-05T00:00:00Z',indicator:'Fixture',status:'Submitted',progress:100,evidence:'Fixture evidence',submittedAt:'2026-01-03T00:00:00Z',submittedBy:'owner-a',verifiedAt:null,verifiedBy:null,verificationNotes:null,version:'BAUG'};
 const record=(guid='case-a',status:HvStatus='CapaMonitoring',actions:CapaView[]=[action]):HvDetail=>({case:{guid,caseNumber:'CASE-A',transferGuid:'tx-a',transferNumber:'TX-A',patientName:'Fixture '+guid,hisNumber:'TEST',ward:'Ward',productCode:'RBC',unitCode:'UNIT-A',status,onsetAt:'2026-01-01T01:00:00Z',reportedAt:'2026-01-01T01:05:00Z',initialSeverity:'Unknown',diagnosisCode:null,severity:null,imputability:null,outcome:null,demo:true,version:'BwgJ'},bloodGroup:'O+',transferStatus:'Stopped',startedAt:'2026-01-01T00:00:00Z',endedAt:'2026-01-01T01:00:00Z',suspectedReaction:true,symptoms:['Unknown'],initialNotes:'Fixture',actionsTaken:'Fixture',samplesSent:null,volumeMl:null,reporterUserGuid:'nurse-a',doctorUserGuid:null,doctorReviewedAt:null,doctorNotes:null,doctorActions:null,doctorLabRequest:null,futureRecommendations:null,doctorReference:null,bankUserGuid:null,bankReviewedAt:null,bankFindings:null,bankSampleReference:null,bankReportReference:null,bankDisposition:null,investigationNotes:null,externalStatus:'NotRequired',externalReference:null,rcaRequired:true,rcaLead:null,rcaMethod:null,rcaMeetingAt:null,rcaParticipants:null,directCause:null,rootCause:null,rcaPublishedAt:'2026-01-02T00:00:00Z',closedAt:null,events:[],actions,vitals:[]});
 beforeEach(()=>{
   current=true;params=new BehaviorSubject(convertToParamMap({guid:'case-a'}));query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{paramMap:params.asObservable(),queryParamMap:query.asObservable(),snapshot:{data:{},get paramMap(){return params.value;},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function create(caps:Record<string,boolean>){
   const f=TestBed.createComponent(HvCreateComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(HvPageAccess),'load').and.callThrough();const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load};
 }
 async function detail(caps:Record<string,boolean|string>){
   const f=TestBed.createComponent(HvDetailComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(HvPageAccess),'load').and.callThrough();const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c,load,api:f.debugElement.injector.get(HemovigilanceService)};
 }
 it('denies reaction report without destination detail access',async()=>{
   const {f,c,load}=await create({candidates:true,report:true});expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();await c.save();http.expectNone(base+'/Report');f.destroy();
 });
 it('posts a single versioned idempotent reaction and retains confirmed ID after navigation failure',async()=>{
   query.next(convertToParamMap({transfer:'tx-a',search:'UNIT-A'}));
   const {f,c,load}=await create({candidates:true,report:true,detail:true});
   const req=http.expectOne(base+'/Candidates');expect(req.request.body.search).toBe('UNIT-A');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   expect(c.selected()?.guid).toBe('tx-a');c.flags={Unknown:true,Fever:true};c.form.severity='Unknown';c.form.notes='Fixture';c.form.actionsTaken='Fixture';c.useNow=true;
   await c.save();http.expectNone(base+'/Report');c.flags={Unknown:true};
   const key=c.clientId;spyOn(window,'confirm').and.returnValue(true);spyOn(TestBed.inject(Router),'navigate').and.resolveTo(false);
   const task=c.save();const post=http.expectOne(base+'/Report');expect(post.request.body.transferVersion).toBe('AQID');expect(post.request.body.clientReportId).toBe(key);post.flush(blob('case-a'));await task;
   expect(c.savedGuid()).toBe('case-a');await c.save();http.expectNone(base+'/Report');f.destroy();
 });
 it('disallows self verification even when verifier capability is present',async()=>{
   const {f,c,load}=await detail({detail:true,capaVerify:true,userGuid:'owner-a'});
   http.expectOne(base+'/Detail/case-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   expect(c.availableCapa(action)).toEqual([]);c.chooseCapa(action,'CapaVerify');expect(c.selectedCapa()).toBeNull();await c.saveCapa(action,'CapaVerify');http.expectNone(base+'/CapaVerify');f.destroy();
 });
 it('posts independent verification with current case and CAPA versions, not edited progress',async()=>{
   const {f,c,load,api}=await detail({detail:true,capaVerify:true,userGuid:'reviewer-a'});
   http.expectOne(base+'/Detail/case-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   c.chooseCapa(action,'CapaVerify');c.progress.evidence='Fixture reviewer';c.progress.percent=1;spyOn(window,'confirm').and.returnValue(true);
   const write=spyOn(api,'capa').and.callThrough();const task=c.saveCapa(action,'CapaVerify');const req=http.expectOne(base+'/CapaVerify');
   expect(req.request.body).toEqual({guid:'capa-a',version:'BAUG',caseVersion:'BwgJ',progress:100,evidence:'Fixture reviewer'});req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/Detail/case-a').flush(blob(record('case-a','CapaMonitoring',[{...action,status:'Verified'}])));await task;expect(c.detail()?.actions[0].status).toBe('Verified');f.destroy();
 });
 it('blocks close until all required CAPA actions are verified',async()=>{
   const {f,c,load}=await detail({detail:true,close:true,userGuid:'reviewer-a'});
   http.expectOne(base+'/Detail/case-a').flush(blob(record()));await load.calls.mostRecent().returnValue;
   c.select('Close');c.form.notes='Fixture';await c.apply();http.expectNone(base+'/Close');expect(c.error()).not.toBeNull();f.destroy();
 });
 it('ignores previous case results after route change and denies export after role invalidation',async()=>{
   const {f,c,load}=await detail({detail:true});
   const old=http.expectOne(base+'/Detail/case-a'),first=load.calls.mostRecent().returnValue;
   params.next(convertToParamMap({guid:'case-b'}));const next=http.expectOne(base+'/Detail/case-b'),second=load.calls.mostRecent().returnValue;
   next.flush(blob(record('case-b')));await second;old.flush(blob(record()));await first;expect(c.detail()?.case.guid).toBe('case-b');
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture case-b');f.destroy();
 });
});
