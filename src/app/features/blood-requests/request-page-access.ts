import { Injectable,inject,signal } from '@angular/core';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import type { RequestCapabilities } from './blood-request-model';

@Injectable()
export class RequestPageAccess {
 private readonly scope=inject(HemoPageScope);
 private readonly api=inject(BloodRequestsService);
 private readonly caps=signal<RequestCapabilities|null>(null);
 readonly loading=signal(false);
 private generation=0;
 requestCan(key:keyof RequestCapabilities):boolean{return this.scope.isCurrent()&&this.caps()?.[key]===true;}
 async load():Promise<void>{
   if(!this.scope.isCurrent())return;
   const generation=++this.generation;this.caps.set(null);this.loading.set(true);
   const current=()=>this.scope.isCurrent()&&generation===this.generation;
   try{const caps=await this.api.capabilities();if(current())this.caps.set(caps??null);}
   catch{/* fail closed */}
   finally{if(current())this.loading.set(false);}
 }
}
