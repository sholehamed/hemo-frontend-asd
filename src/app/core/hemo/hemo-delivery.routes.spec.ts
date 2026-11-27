import {Routes} from '@angular/router';
import {authGuardGuard} from '../../Shared/AuthGuard/auth-guard.guard';
import {hemoAdmissionPilotRoutes} from './hemo-admission-pilot.routes';
import {hemoRequestReadRoutes} from './hemo-request-read.routes';
import {hemoBankReadRoutes} from './hemo-bank-read.routes';
import {hemoTransferReadRoutes} from './hemo-transfer-read.routes';
import {hemoHvReadRoutes} from './hemo-hv-read.routes';
import {hemoQualityReadRoutes} from './hemo-quality-read.routes';
import {hemoDashboardRoutes} from './hemo-dashboard.routes';
describe('R02 complete delivery route wiring',()=>{
 const routes:Routes=[...hemoAdmissionPilotRoutes,...hemoRequestReadRoutes,...hemoBankReadRoutes,...hemoTransferReadRoutes,...hemoHvReadRoutes,...hemoQualityReadRoutes,...hemoDashboardRoutes];
 it('has 62 unique exact guarded HEMO paths and no legacy authentication guard',()=>{
   expect(routes.length).toBe(62);expect(new Set(routes.map(r=>r.path)).size).toBe(62);
   for(const r of routes){expect(r.canActivate).toEqual([authGuardGuard]);expect(r.loadComponent).toBeDefined();}
 });
 it('resolves all lazy components without instantiating a second authentication shell',async()=>{
   for(const r of routes){const component=await (r.loadComponent!() as Promise<unknown>);expect(typeof component).withContext(r.path??'').toBe('function');}
 });
});
