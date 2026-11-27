import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { AdmissionReviewComponent } from './admission-review.component';

describe('R02 scoped admission clinical reviews',()=>{
  let current:boolean;
  let http:HttpTestingController;
  let query:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let kind:'Identity'|'History'|'Clearance';
  const base='https://fixture.invalid/Identity/PatientAdmission';
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  const caps={list:true,detail:true,reviews:true,history:true,review:true};
  const blob=(value:unknown)=>new Blob([JSON.stringify(value)],{type:'application/json'});
  const patient=(guid:string,extra:Record<string,unknown>={})=>({
    guid,firstName:guid===a?'PatientA':'PatientB',lastName:'Fixture',hisNumber:'TEST',
    identificationNumber:'TEST-ID',birthDate:null,ward:'Ward',bedNumber:'1',status:'Active',
    identityStatus:'Pending',historyReviewedAt:null,clearanceChecklist:0,clearanceNotes:null,
    wristbandCode:'HEMO-TEST-001',version:'v1',...extra
  });
  beforeEach(()=>{
    current=true;kind='Identity';query=new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),
      {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}},
      {provide:ActivatedRoute,useValue:{queryParamMap:query.asObservable(),snapshot:{get data(){return {kind};},queryParamMap:convertToParamMap({})}}}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  async function init(mode:typeof kind,permissions:Record<string,boolean>=caps):Promise<ComponentFixture<AdmissionReviewComponent>>{
    kind=mode;
    const f=TestBed.createComponent(AdmissionReviewComponent);
    const start=spyOn(f.componentInstance,'ngOnInit').and.callThrough();
    f.detectChanges();
    http.expectOne(base+'/Capabilities').flush(blob(permissions));
    await start.calls.mostRecent().returnValue;
    f.detectChanges();return f;
  }
  function respond(guid:string,extra:Record<string,unknown>={}){
    http.expectOne(base+'/'+guid).flush(blob(patient(guid,extra)));
    http.expectOne(base+'/'+guid+'/Reviews').flush(blob([]));
    if(kind==='History')http.expectOne(base+'/'+guid+'/History').flush(blob([]));
  }
  it('requires complete identity checklist and sends the current version, then reloads',async()=>{
    const f=await init('Identity'),c=f.componentInstance;
    const selection=c.select(a);respond(a);await selection;
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('PatientA');
    await c.save('Verified');http.expectNone(base+'/Review');
    expect(c.error()).toContain('چک‌لیست');
    for(let i=0;i<5;i++)c.checked(i,true);
    let started!:()=>void;
    const ready=new Promise<void>(resolve=>started=resolve);
    const original=(c as any).loadPatient.bind(c);
    spyOn<any>(c,'loadPatient').and.callFake((guid:string)=>{const promise=original(guid);started();return promise;});
    const pending=c.save('Verified');
    const r=http.expectOne(base+'/Review');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({guid:a,kind:'Identity',outcome:'Verified',checklist:31,notes:null,version:'v1'});
    r.flush(null,{status:204,statusText:'No Content'});
    await ready;respond(a,{identityStatus:'Verified',version:'v2'});
    await pending;
    expect(c.patient()?.version).toBe('v2');expect(c.success()).not.toBeNull();expect(c.saving()).toBeFalse();
    f.destroy();
  });
  it('allows read-only history, fetches history only in that mode and rejects writes',async()=>{
    const f=await init('History',{...caps,review:false}),c=f.componentInstance;
    const pending=c.select(a);respond(a);await pending;f.detectChanges();
    expect(f.nativeElement.textContent).toContain('نقش جاری فقط مجوز مشاهده دارد');
    c.notes='Fixture evidence';
    await c.save('Reviewed');http.expectNone(base+'/Review');
    expect(c.patient()?.guid).toBe(a);f.destroy();
  });
  it('does not enable history without its additional explicit permission',async()=>{
    const f=await init('History',{...caps,history:false}),c=f.componentInstance;
    expect(c.canOpen()).toBeFalse();await c.select(a);
    http.expectNone(base+'/'+a);http.expectNone(base+'/'+a+'/History');
    f.destroy();
  });
  it('preserves discharge prerequisites and draft checklist when the server rejects a write',async()=>{
    const f=await init('Clearance'),c=f.componentInstance;
    const pending=c.select(a);respond(a,{clearanceChecklist:3,clearanceNotes:'Existing draft'});await pending;
    expect(c.notes).toBe('Existing draft');
    for(let i=0;i<5;i++)c.checked(i,true);
    await c.save('Ready');http.expectNone(base+'/Review');
    expect(c.error()).toContain('ابتدا تطبیق هویت');
    const draft=c.save('Draft');
    const r=http.expectOne(base+'/Review');
    expect(r.request.body).toEqual({guid:a,kind:'Clearance',outcome:'Draft',checklist:31,notes:'Existing draft',version:'v1'});
    r.flush(blob({detail:'fixture conflict'}),{status:409,statusText:'Conflict'});
    await draft;expect(c.patient()?.guid).toBe(a);expect(c.success()).toBeNull();expect(c.error()).not.toBeNull();expect(c.saving()).toBeFalse();
    f.destroy();
  });
  it('ignores late responses from the previous selected patient',async()=>{
    const f=await init('Identity'),c=f.componentInstance;
    const first=c.select(a);
    const old=http.expectOne(base+'/'+a),oldReviews=http.expectOne(base+'/'+a+'/Reviews');
    const second=c.select(b);respond(b);await second;
    old.flush(blob(patient(a)));oldReviews.flush(blob([]));await first;
    f.detectChanges();expect(c.patient()?.guid).toBe(b);
    expect(f.nativeElement.textContent).not.toContain('PatientA');
    f.destroy();
  });
  it('suppresses reload and success on role change during a review write',async()=>{
    const f=await init('Identity'),c=f.componentInstance;
    const selection=c.select(a);respond(a);await selection;
    c.notes='Fixture discrepancy';
    const pending=c.save('Mismatch');const r=http.expectOne(base+'/Review');
    current=false;r.flush(null,{status:204,statusText:'No Content'});await pending;
    http.expectNone(base+'/'+a);expect(c.success()).toBeNull();expect(c.canOpen()).toBeFalse();
    f.detectChanges();expect(f.nativeElement.textContent).not.toContain('PatientA');f.destroy();
  });
});
