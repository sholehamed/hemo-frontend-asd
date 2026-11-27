import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { BankDashboardComponent } from './bank-dashboard.component';
import { BankInventoryComponent } from './bank-inventory.component';
import { BankPageAccess } from './bank-page-access';

describe('R02 scoped bank reads',()=>{
 let current:boolean,http:HttpTestingController;
 let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 const base='https://fixture.invalid/Identity/BloodBank';
 const stats={total:4,available:2,reserved:1,thawing:0,ready:0,hold:1,expired:0,expiringSoon:1,discarded:0,approvedRequests:1,temperatureConcerns:0,stock:[]};
 const unit={guid:'unit-a',unitCode:'FIXTURE-UNIT',productCode:'RBC',bloodGroup:'O+',batchNumber:null,supplySource:'fixture',equipmentCode:'fixture',receivedAt:'2026-01-01T00:00:00Z',expiresAt:'2026-01-04T00:00:00Z',status:'Available',expired:false,requestGuid:null,thawStartedAt:null,thawCompletedAt:null,version:'AQID'};
 const page={data:[unit],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
 const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 beforeEach(()=>{
   current=true;query=new BehaviorSubject(convertToParamMap({}));
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
     {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{data:{},queryParamMap:convertToParamMap({})}}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 async function dashboard(caps:Record<string,boolean>){
   const f=TestBed.createComponent(BankDashboardComponent);
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));
   await access.calls.mostRecent().returnValue;
   return {f,load,c:f.componentInstance};
 }
 async function inventory(caps:Record<string,boolean>){
   const f=TestBed.createComponent(BankInventoryComponent);
   const access=spyOn(f.debugElement.injector.get(BankPageAccess),'load').and.callThrough();
   const load=spyOn(f.componentInstance,'load').and.callThrough();
   f.detectChanges();http.expectOne(base+'/Capabilities').flush(blob(caps));
   await access.calls.mostRecent().returnValue;
   return {f,load,c:f.componentInstance};
 }
 it('limits statistics-only role to aggregate bank data',async()=>{
   const {f,c,load}=await dashboard({stats:true});
   http.expectOne(base+'/Stats').flush(blob(stats));await load.calls.mostRecent().returnValue;f.detectChanges();
   http.expectNone(base+'/Inventory');http.expectNone(base+'/TemperatureHistory');
   expect(c.stats()?.available).toBe(2);expect(f.nativeElement.textContent).not.toContain('واحدهای نزدیک انقضا');f.destroy();
 });
 it('retains stats and expiry results when temperature history fails',async()=>{
   const {f,c,load}=await dashboard({stats:true,inventory:true,temperatureHistory:true});
   http.expectOne(base+'/Stats').flush(blob(stats));
   const expiry=http.expectOne(base+'/Inventory');expect(expiry.request.body.status).toBe('ExpiringSoon');expiry.flush(blob(page));
   http.expectOne(base+'/TemperatureHistory').flush(blob({detail:'fixture'}),{status:500,statusText:'Error'});
   await load.calls.mostRecent().returnValue;f.detectChanges();
   expect(c.stats()?.available).toBe(2);expect(c.expiry().length).toBe(1);expect(c.temperatureError()).not.toBeNull();
   expect(f.nativeElement.textContent).toContain('FIXTURE-UNIT');f.destroy();
 });
 it('fails closed without the inventory permission',async()=>{
   const {f,c,load}=await inventory({stats:true});expect(load).not.toHaveBeenCalled();
   await c.load();http.expectNone(base+'/Inventory');f.destroy();
 });
 it('sends only inventory requests and keeps the applied query across pagination',async()=>{
   query.next(convertToParamMap({status:'Expired',request:'ignored'}));
   const {f,c,load}=await inventory({inventory:true,unit:true});
   const req=http.expectOne(base+'/Inventory');expect(req.request.body.status).toBe('Expired');req.flush(blob(page));
   await load.calls.mostRecent().returnValue;f.detectChanges();
   http.expectNone('https://fixture.invalid/Identity/BloodRequest/Capabilities');
   expect(f.nativeElement.textContent).toContain('FIXTURE-UNIT');
   expect(f.nativeElement.querySelector('a[href*="/hemo/bank/unit/"]')).not.toBeNull();
   c.status='Available';const next=c.load(2);const paged=http.expectOne(base+'/Inventory');expect(paged.request.body.status).toBe('Expired');expect(paged.request.body.pageNumber).toBe(2);
   paged.flush(blob({...page,pageNumber:2}));await next;f.destroy();
 });
 it('rejects stale filter results and prevents printing after scope invalidation',async()=>{
   const {f,c,load}=await inventory({inventory:true});
   const old=http.expectOne(base+'/Inventory');const first=load.calls.mostRecent().returnValue;
   query.next(convertToParamMap({status:'Available'}));const req=http.expectOne(base+'/Inventory');const second=load.calls.mostRecent().returnValue;
   req.flush(blob({...page,data:[]}));await second;old.flush(blob(page));await first;
   expect(c.page()?.data.length).toBe(0);
   current=false;f.detectChanges();const print=spyOn(window,'print');c.print();expect(print).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('FIXTURE-UNIT');f.destroy();
 });
});
