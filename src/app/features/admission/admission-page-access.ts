import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AdmissionCapabilities } from '../../core/auth/auth.service';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';

// Page-local, fail-closed UI permissions. The company Guard and backend
// authorization remain authoritative. No independent login/session store.
@Injectable()
export class AdmissionPageAccess {
  private readonly scope=inject(HemoPageScope);
  private readonly transport=inject(HemoCompanyHttp);
  private readonly caps=signal<AdmissionCapabilities|null>(null);
  readonly loading=signal(false);
  private generation=0;
  can(key:keyof AdmissionCapabilities):boolean {
    return this.scope.isCurrent()&&this.caps()?.[key]===true;
  }
  async load():Promise<void>{
    if(!this.scope.isCurrent())return;
    const generation=++this.generation;
    this.caps.set(null);this.loading.set(true);
    try{
      const caps=await firstValueFrom(this.transport.get<AdmissionCapabilities>('/Identity/PatientAdmission/Capabilities'));
      if(this.scope.isCurrent()&&generation===this.generation)this.caps.set(caps??null);
    }catch{/* fail closed */}
    finally{if(this.scope.isCurrent()&&generation===this.generation)this.loading.set(false);}
  }
}
