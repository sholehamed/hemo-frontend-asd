import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '../../Shared/Services/AuthService';
import { authGuardGuard } from '../../Shared/AuthGuard/auth-guard.guard';
import { hemoTransferReadRoutes } from './hemo-transfer-read.routes';

describe('R02 guarded transfer read routes',()=>{
  let previous:string|null;
  let auth:{UserIsAthenticated:jasmine.Spy;CheckPagePermission:jasmine.Spy;OpenLoginPage:jasmine.Spy;OpenforbiddenPage:jasmine.Spy};
  beforeEach(()=>{
    previous=sessionStorage.getItem('url');
    auth={UserIsAthenticated:jasmine.createSpy().and.returnValue(true),CheckPagePermission:jasmine.createSpy().and.returnValue(of(true)),OpenLoginPage:jasmine.createSpy(),OpenforbiddenPage:jasmine.createSpy()};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:auth}]});
  });
  afterEach(()=>{if(previous===null)sessionStorage.removeItem('url');else sessionStorage.setItem('url',previous);});
  async function check(path:string){
    const config=hemoTransferReadRoutes.find(r=>r.path===path)!;
    const snap={routeConfig:config,parent:{routeConfig:{path:''},parent:null}} as unknown as ActivatedRouteSnapshot;
    return firstValueFrom(TestBed.runInInjectionContext(()=>authGuardGuard(snap,{} as RouterStateSnapshot)) as Observable<boolean>);
  }
  it('uses the company guard and exact page patterns for all six transfer routes',async()=>{
    expect(hemoTransferReadRoutes.map(r=>r.path)).toEqual(['hemo/transfusion/tasks','hemo/transfusion/vitals','hemo/transfusion/monitoring','hemo/transfusion/returns','hemo/transfusion/records','hemo/transfusion']);
    for(const r of hemoTransferReadRoutes){
      expect(r.canActivate).toEqual([authGuardGuard]);expect(await check(r.path!)).toBeTrue();
      expect(auth.CheckPagePermission).toHaveBeenCalledWith('/'+r.path);
      expect(sessionStorage.getItem('url')).toBe('/'+r.path);
    }
  });
  it('rejects a denied transfer tasks instead of bypassing page permission',async()=>{
    auth.CheckPagePermission.and.returnValue(of(false));
    expect(await check('hemo/transfusion/tasks')).toBeFalse();expect(auth.OpenforbiddenPage).toHaveBeenCalled();
  });
});
