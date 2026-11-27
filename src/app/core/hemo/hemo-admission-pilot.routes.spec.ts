import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '../../Shared/Services/AuthService';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
import { hemoAdmissionPilotRoutes } from './hemo-admission-pilot.routes';

describe('R02 admission pilot route', () => {
  let auth: {UserIsAthenticated: jasmine.Spy; CheckPagePermission: jasmine.Spy; OpenLoginPage: jasmine.Spy; OpenforbiddenPage: jasmine.Spy};
  let old: string | null;
  beforeEach(() => {
    old = sessionStorage.getItem('url');
    auth = {UserIsAthenticated:jasmine.createSpy().and.returnValue(true), CheckPagePermission:jasmine.createSpy().and.returnValue(of(true)),
      OpenLoginPage:jasmine.createSpy(), OpenforbiddenPage:jasmine.createSpy()};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:auth}]});
  });
  afterEach(() => {
    if(old===null) sessionStorage.removeItem('url'); else sessionStorage.setItem('url',old);
  });
  async function guard(path='admission/stats') {
    const config = hemoAdmissionPilotRoutes.find(r=>r.path===path)!;
    const snapshot = {routeConfig:config,parent:{routeConfig:{path:''},parent:null}} as unknown as ActivatedRouteSnapshot;
    const result=TestBed.runInInjectionContext(()=>authGuardGuard(snapshot,{} as RouterStateSnapshot));
    return firstValueFrom(result as Observable<boolean>);
  }
  it('uses the original guard, with the exact seeded page pattern', async () => {
    expect(hemoAdmissionPilotRoutes.map(r=>r.path)).toEqual(['admission/stats','admission/list','admission/his','admission/new','admission/detail/:guid','admission/identity','admission/history','admission/discharge','admission/dashboard','admission']);
    expect(hemoAdmissionPilotRoutes.every(r=>r.canActivate?.[0]===authGuardGuard)).toBeTrue();
    expect(hemoAdmissionPilotRoutes[0].canActivate).toEqual([authGuardGuard]);
    expect(await guard()).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledOnceWith('/admission/stats');
    expect(sessionStorage.getItem('url')).toBe('/admission/stats');
  });
  it('checks exact seeded new and parameterized detail patterns',async()=>{
    expect(await guard('admission/new')).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledWith('/admission/new');
    expect(await guard('admission/detail/:guid')).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledWith('/admission/detail/:guid');
    expect(sessionStorage.getItem('url')).toBe('/admission/detail/:guid');
  });
  it('checks the exact seeded review routes and kinds',async()=>{
    for(const [path,kind] of [['admission/identity','Identity'],['admission/history','History'],['admission/discharge','Clearance']]){
      expect(hemoAdmissionPilotRoutes.find(r=>r.path===path)?.data?.['kind']).toBe(kind);
      expect(await guard(path)).toBeTrue();
      expect(auth.CheckPagePermission).toHaveBeenCalledWith('/'+path);
    }
  });
  it('guards dashboard alias and existing admission path separately',async()=>{
    expect(await guard('admission/dashboard')).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledWith('/admission/dashboard');
    expect(await guard('admission')).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledWith('/admission');
  });
  it('rejects an unauthorized company role', async () => {
    auth.CheckPagePermission.and.returnValue(of(false));
    expect(await guard()).toBeFalse();
    expect(auth.OpenforbiddenPage).toHaveBeenCalled();
  });
  it('requires the original login for an unauthenticated user', async () => {
    auth.UserIsAthenticated.and.returnValue(false);
    expect(await guard()).toBeFalse();
    expect(auth.OpenLoginPage).toHaveBeenCalled();
    expect(auth.CheckPagePermission).not.toHaveBeenCalled();
  });
});
