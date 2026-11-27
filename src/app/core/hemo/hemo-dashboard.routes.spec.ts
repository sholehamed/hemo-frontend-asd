import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot,RouterStateSnapshot} from '@angular/router';
import {firstValueFrom,Observable,of} from 'rxjs';
import {AuthService} from '../../Shared/Services/AuthService';
import {authGuardGuard} from '../../Shared/AuthGuard/auth-guard.guard';
import {hemoDashboardRoutes} from './hemo-dashboard.routes';
describe('R02 guarded management dashboard',()=>{
 let previous:string|null;
 let auth:{UserIsAthenticated:jasmine.Spy;CheckPagePermission:jasmine.Spy;OpenLoginPage:jasmine.Spy;OpenforbiddenPage:jasmine.Spy};
 beforeEach(()=>{
  previous=sessionStorage.getItem('url');auth={UserIsAthenticated:jasmine.createSpy().and.returnValue(true),CheckPagePermission:jasmine.createSpy().and.returnValue(of(true)),OpenLoginPage:jasmine.createSpy(),OpenforbiddenPage:jasmine.createSpy()};
  TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:auth}]});
 });
 afterEach(()=>{if(previous===null)sessionStorage.removeItem('url');else sessionStorage.setItem('url',previous);});
 async function check(){const snap={routeConfig:hemoDashboardRoutes[0],parent:{routeConfig:{path:''},parent:null}} as unknown as ActivatedRouteSnapshot;
  return firstValueFrom(TestBed.runInInjectionContext(()=>authGuardGuard(snap,{} as RouterStateSnapshot)) as Observable<boolean>);
 }
 it('uses exact private company route without changing company root',async()=>{
  expect(hemoDashboardRoutes.length).toBe(1);expect(hemoDashboardRoutes[0].path).toBe('hemo/dashboard');expect(hemoDashboardRoutes[0].canActivate).toEqual([authGuardGuard]);
  expect(await check()).toBeTrue();expect(auth.CheckPagePermission).toHaveBeenCalledWith('/hemo/dashboard');expect(sessionStorage.getItem('url')).toBe('/hemo/dashboard');
 });
 it('rejects denied dashboard page permission',async()=>{
  auth.CheckPagePermission.and.returnValue(of(false));expect(await check()).toBeFalse();expect(auth.OpenforbiddenPage).toHaveBeenCalled();
 });
});
