import {Injectable,inject,signal} from '@angular/core';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {QualityService} from '../../core/api/quality.service';
import type {QualityCapabilities} from './quality-model';
@Injectable()
export class QualityPageAccess{
 private readonly scope=inject(HemoPageScope);
 private readonly api=inject(QualityService);
 private readonly caps=signal<QualityCapabilities|null>(null);
 readonly loading=signal(false);
 private generation=0;
 qualityCapabilities(){return this.scope.isCurrent()?this.caps():null;}
 qualityCan(key:string){return this.qualityCapabilities()?.permissions?.[key]===true;}
 async load(){
   if(!this.scope.isCurrent())return;
   const generation=++this.generation;this.caps.set(null);this.loading.set(true);
   const current=()=>this.scope.isCurrent()&&generation===this.generation;
   try{const caps=await this.api.capabilities();if(current())this.caps.set(caps??null);}
   catch{/* fail closed */}
   finally{if(current())this.loading.set(false);}
 }
}
