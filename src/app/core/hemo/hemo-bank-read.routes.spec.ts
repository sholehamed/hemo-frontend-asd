import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '../../Shared/Services/AuthService';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
import { hemoBankReadRoutes } from './hemo-bank-read.routes';

describe('R02 guarded bank read routes',()=>{
  let previous:string|null;
  let auth:{UserIsAthenticated:jasmine.Spy;CheckPagePermission:jasmine.Spy;OpenLoginPage:jasmine.Spy;OpenforbiddenPage:jasmine.Spy};
  beforeEach(()=>{
    previous=sessionStorage.getItem('url');
    auth={UserIsAthenticated:jasmine.createSpy().and.returnValue(true),CheckPagePermission:jasmine.createSpy().and.returnValue(of(true)),OpenLoginPage:jasmine.createSpy(),OpenforbiddenPage:jasmine.createSpy()};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:auth}]});
  });
  afterEach(()=>{if(previous===null)sessionStorage.removeItem('url');else sessionStorage.setItem('url',previous);});
  async function check(path:string){
    const config=hemoBankReadRoutes.find(r=>r.path===path)!;
    const snap={routeConfig:config,parent:{routeConfig:{path:''},parent:null}} as unknown as ActivatedRouteSnapshot;
    return firstValueFrom(TestBed.runInInjectionContext(()=>authGuardGuard(snap,{} as RouterStateSnapshot)) as Observable<boolean>);
  }
  it('uses the company guard and exact page patterns for all three bank routes',async()=>{
    expect(hemoBankReadRoutes.map(r=>r.path)).toEqual(['hemo/bank/inventory','hemo/bank/reports','hemo/bank']);
    for(const r of hemoBankReadRoutes){
      expect(r.canActivate).toEqual([authGuardGuard]);expect(await check(r.path!)).toBeTrue();
      expect(auth.CheckPagePermission).toHaveBeenCalledWith('/'+r.path);
      expect(sessionStorage.getItem('url')).toBe('/'+r.path);
    }
  });
  it('rejects a denied inventory instead of bypassing page permission',async()=>{
    auth.CheckPagePermission.and.returnValue(of(false));
    expect(await check('hemo/bank/inventory')).toBeFalse();expect(auth.OpenforbiddenPage).toHaveBeenCalled();
  });
});
