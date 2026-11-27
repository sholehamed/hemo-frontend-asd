import { Injectable,inject,signal } from '@angular/core';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { BloodBankService } from '../../core/api/blood-bank.service';
import type { BankCapabilities } from './bank-model';

@Injectable()
export class BankPageAccess {
 private readonly scope=inject(HemoPageScope);
 private readonly api=inject(BloodBankService);
 private readonly caps=signal<BankCapabilities|null>(null);
 readonly loading=signal(false);
 private generation=0;
 bankCapabilities():BankCapabilities|null{return this.scope.isCurrent()?this.caps():null;}
 bankCan(key:keyof BankCapabilities):boolean{return this.bankCapabilities()?.[key]===true;}
 async load():Promise<void>{
   if(!this.scope.isCurrent())return;
   const generation=++this.generation;this.caps.set(null);this.loading.set(true);
   const current=()=>this.scope.isCurrent()&&generation===this.generation;
   try{const caps=await this.api.capabilities();if(current())this.caps.set(caps??null);}
   catch{/* fail closed */}
   finally{if(current())this.loading.set(false);}
 }
}
