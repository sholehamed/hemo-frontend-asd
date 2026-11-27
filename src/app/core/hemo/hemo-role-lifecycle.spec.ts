import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../Shared/Services/AuthService';
import { HemoContextService } from './hemo-context.service';
import { HemoRoleLifecycle } from './hemo-role-lifecycle';
describe('R02 role scope lifecycle',()=>{
  let role:number;
  let token:string|null;
  let lifecycle:HemoRoleLifecycle;
  let reset:jasmine.Spy;
  let router:{url:string;navigateByUrl:jasmine.Spy};
  beforeEach(()=>{
    role=42;token='fixture-session';
    reset=jasmine.createSpy('reset');
    router={url:'/admission/stats?ward=fixture',navigateByUrl:jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true))};
    TestBed.configureTestingModule({providers:[
      {provide:AuthService,useValue:{GetUserRole:()=>role,GetAccessToken:()=>token,UserIsAthenticated:()=>!!token}},
      {provide:Router,useValue:router},{provide:HemoContextService,useValue:{reset}}
    ]});
    lifecycle=TestBed.inject(HemoRoleLifecycle);
  });
  it('invalidates immediately before changing role and rejects an A-B-A switch',()=>{
    const a=lifecycle.capture();expect(lifecycle.isCurrent(a)).toBeTrue();
    lifecycle.beforeChange(42,43);expect(lifecycle.isCurrent(a)).toBeFalse();expect(reset).toHaveBeenCalledTimes(1);
    role=43;const b=lifecycle.capture();expect(lifecycle.isCurrent(b)).toBeTrue();
    lifecycle.afterChange(42,43);expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/');
    lifecycle.beforeChange(43,42);role=42;
    expect(lifecycle.isCurrent(a)).toBeFalse();expect(lifecycle.isCurrent(b)).toBeFalse();
  });
  it('fails closed on logout and token replacement',()=>{
    const marker=lifecycle.capture();token=null;expect(lifecycle.isCurrent(marker)).toBeFalse();
    token='refreshed';expect(lifecycle.isCurrent(marker)).toBeFalse();
    expect(lifecycle.isCurrent(lifecycle.capture())).toBeTrue();
  });
  it('does not reset on selecting the same role or redirect unrelated pages',()=>{
    const marker=lifecycle.capture();lifecycle.beforeChange(42,42);lifecycle.afterChange(42,42);
    expect(lifecycle.isCurrent(marker)).toBeTrue();expect(reset).not.toHaveBeenCalled();
    router.url='/Identity/users';lifecycle.beforeChange(42,43);role=43;lifecycle.afterChange(42,43);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
