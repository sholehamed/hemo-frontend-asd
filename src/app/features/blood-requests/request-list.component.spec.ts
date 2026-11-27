import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { RequestListComponent } from './request-list.component';
import { RequestPageAccess } from './request-page-access';

describe('R02 scoped blood request read pages',()=>{
  let current:boolean;let http:HttpTestingController;
  let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mode:'list'|'bank'|'approval';
  const base='https://fixture.invalid/Identity/BloodRequest';
  const stats={total:7,draft:1,awaitingDoctor:2,returned:1,awaitingBank:2,rejected:0,cancelled:1};
  const page={data:[{guid:'request-a',requestNumber:'TEST-001',patientAdmissionGuid:'admission-a',patientName:'FixturePatient',hisNumber:'TEST',ward:'Ward',formType:'General',priority:'Urgent',status:'AwaitingDoctor',totalUnits:1,created:'2026-01-01'}],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
  const blob=(value:unknown)=>new Blob([JSON.stringify(value)],{type:'application/json'});
  beforeEach(()=>{
    current=true;mode='list';query=new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
      {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
      {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {mode};},queryParamMap:convertToParamMap({})}}}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  async function start(selected:typeof mode,caps:Record<string,boolean>):Promise<{f:ComponentFixture<RequestListComponent>;load:jasmine.Spy}>{
    mode=selected;
    const f=TestBed.createComponent(RequestListComponent);
    const access=spyOn(f.debugElement.injector.get(RequestPageAccess),'load').and.callThrough();
    const load=spyOn(f.componentInstance,'load').and.callThrough();
    f.detectChanges();
    http.expectOne(base+'/Capabilities').flush(blob(caps));
    await access.calls.mostRecent().returnValue;
    expect(load).toHaveBeenCalledTimes(1);
    return {f,load};
  }
  it('loads only aggregate data for the statistics role',async()=>{
    const {f,load}=await start('list',{stats:true});
    http.expectOne(base+'/Stats').flush(blob(stats));
    await load.calls.mostRecent().returnValue;f.detectChanges();
    http.expectNone(base+'/BindPaging');http.expectNone(base+'/BankQueue');
    expect(f.componentInstance.stats()?.total).toBe(7);
    expect(f.nativeElement.textContent).not.toContain('جستجو و فیلتر');
    f.destroy();
  });
  it('reads the bank queue without requesting list or stats',async()=>{
    const {f,load}=await start('bank',{bankQueue:true,bankDetail:true});
    http.expectOne(base+'/BankQueue').flush(blob(page));
    await load.calls.mostRecent().returnValue;f.detectChanges();
    http.expectNone(base+'/BindPaging');http.expectNone(base+'/Stats');
    expect(f.nativeElement.textContent).toContain('FixturePatient');
    expect(f.nativeElement.querySelector('a[href*="/hemo/requests/bank/request-a"]')).not.toBeNull();
    f.destroy();
  });
  it('requires decide and list for approval, and forces the AwaitingDoctor filter',async()=>{
    const {f,load}=await start('approval',{list:true,decide:true,stats:true});
    const req=http.expectOne(base+'/BindPaging');expect(req.request.body.status).toBe('AwaitingDoctor');
    req.flush(blob(page));await load.calls.mostRecent().returnValue;f.detectChanges();
    http.expectNone(base+'/Stats');
    expect(f.nativeElement.textContent).toContain('FixturePatient');f.destroy();
  });
  it('does not send read requests for a denied approval role',async()=>{
    const {f,load}=await start('approval',{list:true,decide:false,stats:true});
    await load.calls.mostRecent().returnValue;
    http.expectNone(base+'/BindPaging');http.expectNone(base+'/Stats');
    expect(f.componentInstance.allowed()).toBeFalse();f.destroy();
  });
  it('retains the list on independent stats failure',async()=>{
    const {f,load}=await start('list',{list:true,stats:true,nurseCreate:true});
    http.expectOne(base+'/BindPaging').flush(blob(page));
    http.expectOne(base+'/Stats').flush(blob({detail:'fixture failure'}),{status:500,statusText:'Error'});
    await load.calls.mostRecent().returnValue;f.detectChanges();
    expect(f.componentInstance.statsError()).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('FixturePatient');
    expect(f.nativeElement.querySelector('a[href*="/hemo/requests/new"]')).toBeNull();f.destroy();
  });
  it('discards previous patient filter data on query reuse and prevents stats mislabeling',async()=>{
    query.next(convertToParamMap({admission:'admission-a'}));
    const {f,load}=await start('list',{list:true,stats:true});
    const old=http.expectOne(base+'/BindPaging');expect(old.request.body.patientAdmissionGuid).toBe('admission-a');
    const first=load.calls.mostRecent().returnValue;
    query.next(convertToParamMap({admission:'admission-b'}));
    const next=http.expectOne(base+'/BindPaging');expect(next.request.body.patientAdmissionGuid).toBe('admission-b');
    const second=load.calls.mostRecent().returnValue;
    next.flush(blob({...page,data:[]}));await second;
    old.flush(blob(page));await first;f.detectChanges();
    http.expectNone(base+'/Stats');expect(f.componentInstance.page()?.data.length).toBe(0);
    expect(f.nativeElement.textContent).not.toContain('FixturePatient');f.destroy();
  });
  it('ignores late response after role invalidation and prevents printing',async()=>{
    const {f,load}=await start('list',{list:true});
    const req=http.expectOne(base+'/BindPaging');
    current=false;req.flush(blob(page));await load.calls.mostRecent().returnValue;f.detectChanges();
    expect(f.componentInstance.page()).toBeNull();expect(f.nativeElement.textContent).not.toContain('FixturePatient');
    const print=spyOn(window,'print');f.componentInstance.print();expect(print).not.toHaveBeenCalled();
    f.destroy();
  });
});
