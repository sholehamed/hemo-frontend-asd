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
  async function guard() {
    const config = hemoAdmissionPilotRoutes[0];
    const snapshot = {routeConfig:config,parent:{routeConfig:{path:''},parent:null}} as unknown as ActivatedRouteSnapshot;
    const result=TestBed.runInInjectionContext(()=>authGuardGuard(snapshot,{} as RouterStateSnapshot));
    return firstValueFrom(result as Observable<boolean>);
  }
  it('uses the original guard, with the exact seeded page pattern', async () => {
    expect(hemoAdmissionPilotRoutes.length).toBe(1);
    expect(hemoAdmissionPilotRoutes[0].canActivate).toEqual([authGuardGuard]);
    expect(await guard()).toBeTrue();
    expect(auth.CheckPagePermission).toHaveBeenCalledOnceWith('/admission/stats');
    expect(sessionStorage.getItem('url')).toBe('/admission/stats');
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
