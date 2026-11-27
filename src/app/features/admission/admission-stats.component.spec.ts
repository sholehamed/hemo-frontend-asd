import { TestBed } from '@angular/core/testing';
import { AdmissionsService,AdmissionStats } from '../../core/api/admissions.service';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { AdmissionStatsComponent } from './admission-stats.component';
describe('R02 active admission report scope',()=>{
  const data:AdmissionStats={total:7,active:7,verified:0,mismatch:0,ready:0,wards:[{name:'fixture',count:7}],bloodGroups:[]};
  let current:boolean;
  let api:jasmine.SpyObj<AdmissionsService>;
  let component:AdmissionStatsComponent;
  beforeEach(()=>{
    current=true;api=jasmine.createSpyObj<AdmissionsService>('AdmissionsService',['stats']);
    TestBed.configureTestingModule({providers:[
      {provide:AdmissionsService,useValue:api},
      {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}
    ]});
    component=TestBed.runInInjectionContext(()=>new AdmissionStatsComponent());
  });
  it('does not display or export late data after role invalidation',async()=>{
    let resolve!:(value:AdmissionStats)=>void;
    api.stats.and.returnValue(new Promise<AdmissionStats>(r=>resolve=r));
    const pending=component.load();
    current=false;resolve(data);await pending;
    expect(component.scopeValid()).toBeFalse();expect(component.stats()).toBeNull();
    const print=spyOn(window,'print');
    component.print();component.exportCsv();
    expect(print).not.toHaveBeenCalled();
  });
  it('clears state at destruction and ignores late responses',async()=>{
    api.stats.and.resolveTo(data);await component.load();expect(component.stats()?.total).toBe(7);
    let resolve!:(value:AdmissionStats)=>void;
    api.stats.and.returnValue(new Promise<AdmissionStats>(r=>resolve=r));
    const pending=component.load();component.ngOnDestroy();resolve(data);await pending;
    expect(component.stats()).toBeNull();expect(component.wards()).toEqual([]);expect(component.scopeValid()).toBeFalse();
  });
});
