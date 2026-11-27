import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { AdmissionDashboardComponent } from './admission-dashboard.component';
import { AdmissionPageAccess } from './admission-page-access';

describe('R02 scoped admission dashboard',()=>{
  let current:boolean;let http:HttpTestingController;
  const base='https://fixture.invalid/Identity/PatientAdmission';
  const stats={total:7,active:7,verified:0,mismatch:0,ready:0,wards:[],bloodGroups:[]};
  const page={data:[{guid:'fixture-id',firstName:'FixturePatient',lastName:'Demo',hisNumber:'TEST',ward:'Ward',bedNumber:'1',identityStatus:'Pending',status:'Active',admittedAt:'2026-01-01'}],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
  const blob=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
  beforeEach(()=>{
    current=true;TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
      {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  async function start(caps:Record<string,boolean>):Promise<{f:ComponentFixture<AdmissionDashboardComponent>;pending:Promise<void>}>{
    const f=TestBed.createComponent(AdmissionDashboardComponent);
    const load=spyOn(f.componentInstance,'load').and.callThrough();
    const access=spyOn(f.debugElement.injector.get(AdmissionPageAccess),'load').and.callThrough();
    f.detectChanges();
    const pending=load.calls.mostRecent().returnValue;
    http.expectOne(base+'/Capabilities').flush(blob(caps));
    await access.calls.mostRecent().returnValue;
    return {f,pending};
  }
  it('loads only aggregate data for a statistics-only role',async()=>{
    const {f,pending}=await start({stats:true});
    http.expectOne(base+'/Stats').flush(blob(stats));await pending;f.detectChanges();
    http.expectNone(base+'/BindPaging');expect(f.componentInstance.stats()?.total).toBe(7);
    expect(f.nativeElement.textContent).not.toContain('استعلام فوری');
    expect(f.nativeElement.querySelector('app-admission-create')).toBeNull();
    await f.componentInstance.searchPatients();http.expectNone(base+'/BindPaging');f.destroy();
  });
  it('loads only the list for a list-only role and does not show unauthorized actions',async()=>{
    const {f,pending}=await start({list:true});
    http.expectOne(base+'/BindPaging').flush(blob(page));await pending;f.detectChanges();
    http.expectNone(base+'/Stats');
    expect(f.nativeElement.textContent).toContain('FixturePatient');
    expect(f.nativeElement.querySelector('a[href*="/admission/detail"]')).toBeNull();
    expect(f.nativeElement.querySelector('app-admission-metrics')).toBeNull();
    f.destroy();
  });
  it('retains the permitted list when the independent stats request fails',async()=>{
    const {f,pending}=await start({stats:true,list:true,detail:true});
    http.expectOne(base+'/Stats').flush(blob({detail:'fixture failure'}),{status:500,statusText:'Error'});
    http.expectOne(base+'/BindPaging').flush(blob(page));await pending;f.detectChanges();
    expect(f.componentInstance.statsError()).not.toBeNull();expect(f.componentInstance.listError()).toBeNull();
    expect(f.nativeElement.textContent).toContain('FixturePatient');f.destroy();
  });
  it('rejects a late search response after role invalidation',async()=>{
    const {f,pending}=await start({list:true});
    http.expectOne(base+'/BindPaging').flush(blob(page));await pending;f.detectChanges();
    f.componentInstance.search='۱۲۳';const search=f.componentInstance.searchPatients();
    const req=http.expectOne(base+'/BindPaging');expect(req.request.body.search).toBe('123');
    current=false;req.flush(blob(page));await search;f.detectChanges();
    expect(f.componentInstance.results()).toBeNull();expect(f.nativeElement.textContent).not.toContain('FixturePatient');f.destroy();
  });
});
