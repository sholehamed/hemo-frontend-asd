import { Injectable,inject,signal } from '@angular/core';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemovigilanceService } from '../../core/api/hemovigilance.service';
import type { HvCapability,HvCapabilities } from './hv-model';

@Injectable()
export class HvPageAccess{
 private readonly scope=inject(HemoPageScope);
 private readonly api=inject(HemovigilanceService);
 private readonly caps=signal<HvCapabilities|null>(null);
 readonly loading=signal(false);
 private generation=0;
 hvCapabilities(){return this.scope.isCurrent()?this.caps():null;}
 hvCan(key:HvCapability){return this.hvCapabilities()?.[key]===true;}
 async load(){
   if(!this.scope.isCurrent())return;
   const generation=++this.generation;this.caps.set(null);this.loading.set(true);
   const current=()=>this.scope.isCurrent()&&generation===this.generation;
   try{const caps=await this.api.capabilities();if(current())this.caps.set(caps??null);}
   catch{/* fail closed */}
   finally{if(current())this.loading.set(false);}
 }
}
