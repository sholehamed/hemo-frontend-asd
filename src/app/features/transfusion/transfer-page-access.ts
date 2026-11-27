import { Injectable,inject,signal } from '@angular/core';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { TransfusionService } from '../../core/api/transfusion.service';
import type { CapabilityKey,TransferCapabilities } from './transfer-model';

@Injectable()
export class TransferPageAccess{
 private readonly scope=inject(HemoPageScope);
 private readonly api=inject(TransfusionService);
 private readonly caps=signal<TransferCapabilities|null>(null);
 readonly loading=signal(false);
 private generation=0;
 transferCapabilities(){return this.scope.isCurrent()?this.caps():null;}
 transferCan(key:CapabilityKey){return this.transferCapabilities()?.[key]===true;}
 async load(){
   if(!this.scope.isCurrent())return;
   const generation=++this.generation;this.caps.set(null);this.loading.set(true);
   const current=()=>this.scope.isCurrent()&&generation===this.generation;
   try{const caps=await this.api.capabilities();if(current())this.caps.set(caps??null);}
   catch{/* fail closed */}
   finally{if(current())this.loading.set(false);}
 }
}
