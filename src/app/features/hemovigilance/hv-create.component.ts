import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {HvPageAccess} from './hv-page-access';
import {Subscription} from 'rxjs';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {measuredFields,measuredUtc} from '../transfusion/transfer-time';
import {Candidate,SYMPTOMS,SEVERITIES,demo} from './hv-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,HemovigilanceService,HvPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./hv-create.component.html'})
export class HvCreateComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(HvPageAccess);private api=inject(HemovigilanceService);private router=inject(Router);private route=inject(ActivatedRoute);
 readonly page=signal<BankPage<Candidate>|null>(null);readonly selected=signal<Candidate|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly savedGuid=signal<string|null>(null);readonly error=signal<string|null>(null);
 readonly symptoms=Object.entries(SYMPTOMS);readonly severities=Object.entries(SEVERITIES);readonly date=bankDateTime;readonly product=productLabel;readonly fa=fa;readonly demo=demo;
 search=this.route.snapshot.queryParamMap.get('search')??'';private applied='';private selectedTransfer=this.route.snapshot.queryParamMap.get('transfer');
 flags:Record<string,boolean>={};onset=measuredFields();useNow=false;clientId='';
 form={severity:'',notes:'',actionsTaken:'',samplesSent:'',volumeMl:null as number|null};
 private seq=0;private query?:Subscription;
 canOpen(){return this.auth.hvCan('candidates')&&this.auth.hvCan('report')&&this.auth.hvCan('detail');}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clear(){this.selected.set(null);this.clientId='';this.flags={};this.onset=measuredFields();this.useNow=false;this.form={severity:'',notes:'',actionsTaken:'',samplesSent:'',volumeMl:null};}
 async ngOnInit(){await this.auth.load();if(!this.canOpen())return;this.query=this.route.queryParamMap.subscribe(q=>{if(this.saving()||this.savedGuid())return;this.search=q.get('search')??'';this.selectedTransfer=q.get('transfer');void this.load();});}
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.savedGuid.set(null);this.clear();this.search='';}
 async load(pageNumber=1){
   if(!this.canOpen()||this.saving()||this.savedGuid())return;
   const seq=++this.seq;this.clear();this.page.set(null);this.busy.set(true);this.error.set(null);
   if(pageNumber===1)this.applied=this.search;
   try{const p=await this.api.candidates(this.applied,pageNumber);if(!this.current(seq))return;this.page.set(p);this.busy.set(false);const c=p.data.find(x=>x.guid===this.selectedTransfer);if(c)this.choose(c);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 cancel(){if(!this.saving())this.clear();}
 choose(c:Candidate){if(!this.canOpen()||this.busy()||this.saving()||this.savedGuid())return;const item=this.page()?.data.find(x=>x.guid===c.guid&&x.version===c.version);if(!item)return;this.selected.set(item);this.clientId=globalThis.crypto?.randomUUID?.()??'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,k=>{const v=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (k==='x'?v:(v&3)|8).toString(16);});this.flags={};this.onset=measuredFields();this.useNow=false;this.form={severity:'',notes:'',actionsTaken:'',samplesSent:'',volumeMl:null};this.error.set(null);}
 async save(){const c=this.selected(),v=this.form;if(!c||!this.canOpen()||this.busy()||this.saving()||this.savedGuid())return;const seq=this.seq;this.error.set(null);try{
 const symptoms=Object.keys(this.flags).filter(k=>this.flags[k]&&Object.prototype.hasOwnProperty.call(SYMPTOMS,k));if(!symptoms.length||symptoms.includes('Unknown')&&symptoms.length>1||!Object.prototype.hasOwnProperty.call(SEVERITIES,v.severity)||!v.notes.trim()||!v.actionsTaken.trim())throw new Error('علائم مشاهده‌شده یا نامشخص، درجه ثبت‌شده و شرح گزارش/اقدامات واقعی را تکمیل کنید.');
 const onsetAt=this.useNow?new Date().toISOString():measuredUtc(this.onset.date,this.onset.time);
 if(!window.confirm('گزارش مشاهده‌شده به پرونده مرتبط ثبت شود؟'))return;this.saving.set(true);
 const id=await this.api.report({transferGuid:c.guid,transferVersion:c.version,clientReportId:this.clientId,onsetAt,symptoms,initialSeverity:v.severity,notes:v.notes,actionsTaken:v.actionsTaken,samplesSent:v.samplesSent||null,volumeMl:v.volumeMl});if(!this.current(seq))return;this.savedGuid.set(id);this.clear();this.page.set(null);await this.router.navigate(['/hemo/hv/detail',id]);
 }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}}
}
