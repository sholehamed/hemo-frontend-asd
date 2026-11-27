import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestPageAccess } from '../blood-requests/request-page-access';
import { BankPageAccess } from './bank-page-access';
import { BankInventoryComponent } from './bank-inventory.component';
import { BankTemperatureComponent } from './bank-temperature.component';
import { BankLabHistoryComponent } from './bank-lab-history.component';
import { blankClinical,RequestDetail } from '../blood-requests/blood-request-model';

describe('R02 remaining bank workflows',()=>{
 let current:boolean,mode:string,http:HttpTestingController;
 let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/BloodBank',requests='https://fixture.invalid/Identity/BloodRequest';
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 const page={data:[],pageNumber:1,totalCount:0,totalPages:0,hasPreviousPage:false,hasNextPage:false};
 const request=(guid:string):RequestDetail=>({request:{guid,requestNumber:'REQ-'+guid,patientAdmissionGuid:'patient-a',patientName:'Fixture '+guid,hisNumber:'TEST',ward:'Ward',source:'Nurse',formType:'General',priority:'Routine',status:'AwaitingBank',created:'2026-01-01',submittedAt:null,totalUnits:1,owned:false},clientRequestId:'fixture-key',version:'BAUG',bloodGroup:'O+',identityStatus:'Verified',bedNumber:'1',items:[{productCode:'RBC',quantity:1,requestedBloodGroup:null,specialInstructions:null}],clinical:blankClinical(),history:[],admissionChanged:false});
 beforeEach(()=>{
   current=true;mode='inventory';query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {mode};},get queryParamMap(){return query.value;}}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function inventory(caps:Record<string,boolean>,requestCaps:Record<string,boolean>={}){
   const f=TestBed.createComponent(BankInventoryComponent);
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();
   const reqAccess=spyOn(f.debugElement.injector.get(RequestPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   const queue=spyOn(f.componentInstance,'loadQueue').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   if(caps['inventory']&&mode!=='inventory'){http.expectOne(requests+'/Capabilities').flush(blob(requestCaps));await reqAccess.calls.mostRecent().returnValue;}
   return {f,c:f.componentInstance,load,queue,api:f.debugElement.injector.get(BloodBankService)};
 }
 it('denies Crossmatch without request detail permission',async()=>{
   mode='lab';const {f,c,load}=await inventory({inventory:true,test:true},{bankQueue:true});
   expect(c.canOpen()).toBeFalse();expect(load).not.toHaveBeenCalled();http.expectNone(base+'/Inventory');http.expectNone(requests+'/BankQueue');f.destroy();
 });
 it('forces the thaw queue despite query, filter and reset changes',async()=>{
   mode='thaw';query.next(convertToParamMap({status:'Available'}));const {f,c,load}=await inventory({inventory:true,thaw:true});
   let req=http.expectOne(base+'/Inventory');expect(req.request.body.status).toBe('ThawQueue');req.flush(blob(page));await load.calls.mostRecent().returnValue;
   c.status='Available';c.reset();req=http.expectOne(base+'/Inventory');expect(req.request.body.status).toBe('ThawQueue');req.flush(blob(page));await load.calls.mostRecent().returnValue;f.destroy();
 });
 it('returns a selected request with its version and reloads both queues',async()=>{
   mode='lab';const {f,c,load,queue,api}=await inventory({inventory:true,test:true,returnRequest:true},{bankQueue:true,bankDetail:true});
   http.expectOne(base+'/Inventory').flush(blob(page));http.expectOne(requests+'/BankQueue').flush(blob(page));await load.calls.mostRecent().returnValue;await queue.calls.mostRecent().returnValue;
   const choose=c.choose('request-a');http.expectOne(requests+'/Bank/request-a').flush(blob(request('request-a')));
   // Wait for the scoped selection to schedule the inventory read.
   for(let i=0;i<20&&load.calls.count()<2;i++)await new Promise(resolve=>setTimeout(resolve,0));
   http.expectOne(base+'/Inventory').flush(blob(page));await choose;
   spyOn(window,'confirm').and.returnValue(true);c.returnReason='fixture reason';
   const returned=spyOn(api,'returnRequest').and.callThrough();const task=c.returnRequest();
   const req=http.expectOne(base+'/ReturnRequest');expect(req.request.body.version).toBe('BAUG');expect(req.request.body.requestGuid).toBe('request-a');
   req.flush(null,{status:204,statusText:'No Content'});await returned.calls.mostRecent().returnValue;
   http.expectOne(base+'/Inventory').flush(blob(page));http.expectOne(requests+'/BankQueue').flush(blob(page));await task;
   expect(c.selected()).toBeNull();expect(c.success()).not.toBeNull();f.destroy();
 });
 async function temperature(caps:Record<string,boolean>){
   const f=TestBed.createComponent(BankTemperatureComponent);const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));await access.calls.mostRecent().returnValue;
   return {f,c:f.componentInstance,load};
 }
 it('does not post temperature for history-only role',async()=>{
   const {f,c,load}=await temperature({temperatureHistory:true});http.expectOne(base+'/TemperatureHistory').flush(blob(page));await load.calls.mostRecent().returnValue;
   await c.save();http.expectNone(base+'/Temperature');f.destroy();
 });
 it('requires documented concern and permits write-only temperature without history reads',async()=>{
   const {f,c}=await temperature({temperature:true});c.form={equipmentCode:'FIXTURE',temperature:5,assessment:'Concern',notes:''};c.measured={date:'1405/09/01',time:'10:00'};
   await c.save();http.expectNone(base+'/Temperature');c.form.notes='fixture observation';spyOn(window,'confirm').and.returnValue(true);
   const task=c.save();const req=http.expectOne(base+'/Temperature');expect(req.request.body.assessment).toBe('Concern');req.flush(blob('temperature-a'));await task;
   http.expectNone(base+'/TemperatureHistory');expect(c.success()).not.toBeNull();expect(c.form.temperature).toBeNull();f.destroy();
 });
 it('rejects old lab report results when the route request changes',async()=>{
   query.next(convertToParamMap({request:'request-a'}));
   const f=TestBed.createComponent(BankLabHistoryComponent),c=f.componentInstance;
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();const load=spyOn(c,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob({labHistory:true}));await access.calls.mostRecent().returnValue;
   const old=http.expectOne(base+'/LabHistory'),first=load.calls.mostRecent().returnValue;expect(old.request.body.requestGuid).toBe('request-a');
   query.next(convertToParamMap({request:'request-b'}));const next=http.expectOne(base+'/LabHistory'),second=load.calls.mostRecent().returnValue;expect(next.request.body.requestGuid).toBe('request-b');
   next.flush(blob(page));await second;old.flush(blob({...page,totalCount:99}));await first;
   expect(c.page()?.totalCount).toBe(0);current=false;const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();f.destroy();
 });
});
