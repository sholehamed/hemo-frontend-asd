import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {API_BASE_URL} from '../../Services/api-client';
import {HemoRoleLifecycle} from '../../core/hemo/hemo-role-lifecycle';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {HvPageAccess} from './hv-page-access';
import {HvReportsComponent} from './hv-reports.component';
import {ReportRow,ReportDetail,Summary} from './hv-model';

describe('R02 scoped hemovigilance reports',()=>{
 let current:boolean,http:HttpTestingController;
 const base='https://fixture.invalid/Identity/Hemovigilance';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const summary:Summary={total:2,open:1,closed:1,pendingDoctor:1,pendingBank:0,rcaOpen:0,capaMonitoring:0,capaOpen:0,capaOverdue:0,externalPending:0,startedTransfers:4,byDiagnosis:[],bySeverity:[],byWard:[],byProduct:[],byStatus:[]};
 const row:ReportRow={guid:'report-a',reportNumber:'HVR-A',title:'Fixture report',fromAt:'2026-01-01T00:00:00Z',toAt:'2026-01-31T23:59:59Z',ward:null,productCode:null,preparedAt:'2026-02-01T00:00:00Z',preparedBy:'officer-a',externalStatus:'NotRecorded',externalReference:null,version:'AQID'};
 const page={data:[row],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 const archived:ReportDetail={report:row,summary};
 beforeEach(()=>{
   current=true;
   TestBed.configureTestingModule({providers:[provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function start(caps:Record<string,boolean>){
   const f=TestBed.createComponent(HvReportsComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(HvPageAccess),'load').and.callThrough(),load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   if(c.canOpen()){http.expectOne(base+'/Reports').flush(blob(page));await load.calls.mostRecent().returnValue;}
   return {f,c,api:f.debugElement.injector.get(HemovigilanceService)};
 }
 it('fails closed when only report list access is granted',async()=>{
   const {f,c}=await start({reports:true,stats:true,archive:true});expect(c.canOpen()).toBeFalse();
   await c.showPreview();await c.archive();await c.open('report-a');http.expectNone(base+'/Reports');http.expectNone(base+'/Archive');http.expectNone(base+'/Stats');http.expectNone(base+'/ReportDetail/report-a');f.destroy();
 });
 it('allows independent reviewer to open a stored snapshot but not write',async()=>{
   const {f,c}=await start({reports:true,reportDetail:true,stats:true});
   const task=c.open('report-a');http.expectOne(base+'/ReportDetail/report-a').flush(blob(archived));await task;
   expect(c.detail()?.summary.total).toBe(2);await c.archive();await c.recordExternal();http.expectNone(base+'/Archive');http.expectNone(base+'/ReportExternal');f.destroy();
 });
 it('rejects invalid dates before requesting a preview',async()=>{
   const {f,c}=await start({reports:true,reportDetail:true,stats:true});c.form.fromDate='invalid';await c.showPreview();
   expect(c.error()).not.toBeNull();http.expectNone(base+'/Stats');f.destroy();
 });
 it('keeps the applied preview filter rather than current form edits',async()=>{
   const {f,c}=await start({reports:true,reportDetail:true,stats:true});
   c.form.ward='Ward A';const task=c.showPreview();const req=http.expectOne(base+'/Stats');expect(req.request.body.ward).toBe('Ward A');c.form.ward='Ward B';
   req.flush(blob(summary));await task;expect(c.previewInput()?.ward).toBe('Ward A');expect(c.preview()?.total).toBe(2);f.destroy();
 });
 it('retains confirmed archive identifier if reload fails and prevents a duplicate write',async()=>{
   const {f,c,api}=await start({reports:true,reportDetail:true,archive:true});
   spyOn(window,'confirm').and.returnValue(true);const write=spyOn(api,'archive').and.callThrough();
   const task=c.archive();http.expectOne(base+'/Archive').flush(blob('report-a'));await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/ReportDetail/report-a').flush(blob({detail:'fixture failure'}),{status:500,statusText:'Error'});
   http.expectOne(base+'/Reports').flush(blob(page));await task;expect(c.savedGuid()).toBe('report-a');expect(c.success()).not.toBeNull();expect(c.error()).not.toBeNull();
   await c.archive();http.expectNone(base+'/Archive');const recover=c.open('report-a');http.expectOne(base+'/ReportDetail/report-a').flush(blob(archived));await recover;
   expect(c.detail()?.report.guid).toBe('report-a');f.destroy();
 });
 it('records external status using current report version and refreshes snapshot without regenerating it',async()=>{
   const {f,c,api}=await start({reports:true,reportDetail:true,reportExternal:true});
   const open=c.open('report-a');http.expectOne(base+'/ReportDetail/report-a').flush(blob(archived));await open;
   c.externalForm={status:'SentManually',reference:''};await c.recordExternal();http.expectNone(base+'/ReportExternal');
   c.externalForm.reference='REF-A';spyOn(window,'confirm').and.returnValue(true);const write=spyOn(api,'reportExternal').and.callThrough();const task=c.recordExternal();
   const req=http.expectOne(base+'/ReportExternal');expect(req.request.body).toEqual({guid:'report-a',version:'AQID',status:'SentManually',reference:'REF-A'});req.flush(null,{status:204,statusText:'No Content'});await write.calls.mostRecent().returnValue;
   http.expectOne(base+'/ReportDetail/report-a').flush(blob({report:{...row,externalStatus:'SentManually',externalReference:'REF-A',version:'BAUG'},summary}));http.expectOne(base+'/Reports').flush(blob(page));await task;
   expect(c.detail()?.report.version).toBe('BAUG');expect(c.detail()?.summary.total).toBe(2);http.expectNone(base+'/Stats');f.destroy();
 });
 it('does not display late archive response or permit print after role invalidation',async()=>{
   const {f,c}=await start({reports:true,reportDetail:true});const task=c.open('report-a');const req=http.expectOne(base+'/ReportDetail/report-a');current=false;req.flush(blob(archived));await task;f.detectChanges();
   expect(c.detail()).toBeNull();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Fixture report');f.destroy();
 });
});
