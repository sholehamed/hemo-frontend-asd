import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { AdmissionListComponent } from './admission-list.component';
import { AdmissionHisComponent } from './admission-his.component';

describe('R02 admission read pages in current Angular app',()=>{
  let current:boolean;
  let http:HttpTestingController;
  const base='https://fixture.invalid/Identity/PatientAdmission';
  const page={data:[{guid:'fixture-id',firstName:'FixturePatient',lastName:'Demo',hisNumber:'fixture-1',ward:'demo',bedNumber:'1',identityStatus:'Pending',status:'Active',admittedAt:'2026-01-01'}],pageNumber:1,totalCount:1,totalPages:1,hasPreviousPage:false,hasNextPage:false};
  const blob=(value:unknown)=>new Blob([JSON.stringify(value)],{type:'application/json'});
  beforeEach(()=>{
    current=true;
    TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
      {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  it('renders actual list and hides not-yet-active clinical links, without requesting denied stats',async()=>{
    const fixture=TestBed.createComponent(AdmissionListComponent);
    fixture.detectChanges();
    http.expectOne(base+'/BindPaging').flush(blob(page));
    http.expectOne(base+'/Capabilities').flush(blob({stats:false,list:true}));
    await fixture.whenStable();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FixturePatient');
    expect(fixture.nativeElement.querySelector('a[href*="/admission/detail"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href*="/admission/new"]')).toBeNull();
    http.expectNone(base+'/Stats');
    current=false;fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('FixturePatient');
    await fixture.componentInstance.exportRows();
    http.expectNone(base+'/BindPaging');
    fixture.destroy();
  });
  it('renders HIS records without claiming external connectivity, then rejects stale response',async()=>{
    const fixture=TestBed.createComponent(AdmissionHisComponent);
    fixture.detectChanges();
    http.expectOne(base+'/BindPaging').flush(blob(page));
    await fixture.whenStable();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FixturePatient');
    expect(fixture.nativeElement.textContent).toContain('پیکربندی نشده');
    const pending=fixture.componentInstance.load();
    const req=http.expectOne(base+'/BindPaging');
    current=false;req.flush(blob(page));await pending;fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('FixturePatient');
    fixture.destroy();
  });
});
