import { Component,OnInit,OnDestroy,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { RequestPageAccess } from '../blood-requests/request-page-access';
import { combineLatest,Subscription } from 'rxjs';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel,RequestDetail,RequestPage } from '../blood-requests/blood-request-model';
import { UnitDetail,BankAction,BANK_ACTION,UNIT_STATUS,LAB_RESULTS,ASSESSMENTS,CONCLUSIONS,SECOND_SAMPLE,availableActions,statusLabel,LabInput } from './bank-model';
import { bankDateTime,toUtc } from './bank-time';
const emptyLab=()=>({sampleReference:'',secondSample:'',labelGroup:'',method:'',immediateSpin:'',phase37:'',ahg:'',dat:'',antibodyScreen:'',reportReference:'',conclusion:'',notes:''});
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BloodRequestsService,BankPageAccess,RequestPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-unit.component.html',styleUrl:'./bank-unit.component.css'})
export class BankUnitComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);readonly requestAccess=inject(RequestPageAccess);private api=inject(BloodBankService);private requests=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 private guid='';
 readonly detail=signal<UnitDetail|null>(null);readonly request=signal<RequestDetail|null>(null);readonly queue=signal<RequestPage|null>(null);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly requestError=signal<string|null>(null);readonly queueBusy=signal(false);
 readonly action=signal<BankAction|null>(null);readonly actions=computed(()=>{const u=this.detail()?.unit;return u?availableActions(u,this.auth.bankCapabilities()):[];});
 readonly canLab=computed(()=>{const u=this.detail()?.unit,r=this.request();return !!u&&!!r&&r.request.status==='AwaitingBank'&&this.auth.bankCan('test')&&this.requestAccess.requestCan('bankDetail')&&!u.expired&&!u.equipmentBlocked&&!r.admissionChanged&&['Available','Reserved','Ready'].includes(u.status)&&(!u.requestGuid||u.requestGuid===r.request.guid)&&r.items.some(x=>x.productCode===u.productCode);});
 readonly actionLabels=BANK_ACTION;readonly statuses=UNIT_STATUS;readonly resultLabels=LAB_RESULTS;readonly conclusions=CONCLUSIONS;readonly sampleLabels=SECOND_SAMPLE;readonly assessmentLabels=ASSESSMENTS;readonly results=Object.entries(LAB_RESULTS);readonly conclusionOptions=Object.entries(CONCLUSIONS);readonly sampleOptions=Object.entries(SECOND_SAMPLE);
 readonly product=productLabel;readonly label=statusLabel;readonly date=bankDateTime;readonly fa=fa;readonly groups=BLOOD_GROUPS;
 readonly phases:{key:'immediateSpin'|'phase37'|'ahg'|'dat'|'antibodyScreen';label:string}[]=[{key:'immediateSpin',label:'فاز فوری (IS)'},{key:'phase37',label:'فاز ۳۷ درجه'},{key:'ahg',label:'فاز آنتی‌گلوبولین (AHG)'},{key:'dat',label:'Direct Coombs (DAT)'},{key:'antibodyScreen',label:'Antibody Screening'}];
 queueSearch='';reason='';method='';temperature:number|null=null;effectiveExpiry={date:'',time:''};lab=emptyLab();
 private routeSub?:Subscription;private seq=0;private selectionSeq=0;private queueSeq=0;private selectionBusy=signal(false);
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 readonly choosing=this.selectionBusy.asReadonly();
 private clearAction(){this.action.set(null);this.reason=this.method='';this.temperature=null;this.effectiveExpiry={date:'',time:''};this.lab=emptyLab();}
 async ngOnInit(){
   await this.auth.load();if(!this.auth.bankCan('unit'))return;
   await this.requestAccess.load();if(!this.scope.isCurrent())return;
   this.routeSub=combineLatest([this.route.paramMap,this.route.queryParamMap]).subscribe(([p,q])=>{
     ++this.seq;++this.selectionSeq;++this.queueSeq;this.guid=p.get('guid')??'';
     this.detail.set(null);this.request.set(null);this.queue.set(null);this.queueBusy.set(false);this.selectionBusy.set(false);this.queueSearch='';this.requestError.set(null);this.success.set(null);this.clearAction();
     if(this.guid)void this.load(q.get('request'));
   });
 }
 ngOnDestroy(){this.routeSub?.unsubscribe();this.scope.invalidate();++this.seq;++this.selectionSeq;++this.queueSeq;this.detail.set(null);this.request.set(null);this.queue.set(null);this.queueSearch='';this.clearAction();}
 async load(requestGuid?:string|null){
   if(!this.auth.bankCan('unit')||!this.guid)return;
   const seq=++this.seq;const guid=this.guid;const selectedId=requestGuid===null?null:requestGuid??this.request()?.request.guid;
   ++this.selectionSeq;this.selectionBusy.set(false);this.detail.set(null);this.request.set(null);this.clearAction();this.busy.set(true);this.error.set(null);
   try{
     const d=await this.api.unit(guid);if(!this.current(seq))return;
     if(d.unit.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه واحد مطابقت ندارد.');
     this.detail.set(d);
     const id=d.unit.requestGuid??selectedId;if(id&&this.requestAccess.requestCan('bankDetail'))await this.choose(id,true);
   }catch(e){if(this.current(seq)){this.detail.set(null);this.error.set(message(e));}}
   finally{if(this.current(seq))this.busy.set(false);}
 }
 async loadQueue(pageNumber=1){
   if(!this.auth.bankCan('unit')||!this.requestAccess.requestCan('bankQueue')||!this.requestAccess.requestCan('bankDetail')||this.busy())return;
   const seq=++this.queueSeq;this.queueBusy.set(true);this.queue.set(null);this.requestError.set(null);
   const current=()=>this.scope.isCurrent()&&seq===this.queueSeq;
   try{const q=await this.requests.bank({search:this.queueSearch,pageNumber,pageSize:20});if(current())this.queue.set(q);}
   catch(e){if(current())this.requestError.set(message(e));}finally{if(current())this.queueBusy.set(false);}
 }
 async choose(id:string,internal=false){
   const u=this.detail()?.unit;if(!u||!this.auth.bankCan('unit')||!this.requestAccess.requestCan('bankDetail')||(!internal&&this.busy())||(u.requestGuid&&u.requestGuid!==id))return;
   const seq=++this.selectionSeq;const pageSeq=this.seq;
   const current=()=>this.current(pageSeq)&&seq===this.selectionSeq;
   this.request.set(null);this.requestError.set(null);this.clearAction();this.selectionBusy.set(!!id);
   if(!id)return;
   try{const r=await this.requests.get(id,true);if(!current())return;if(r.request.guid.toLowerCase()!==id.toLowerCase())throw new Error('شناسه درخواست مطابقت ندارد.');this.request.set(r);}
   catch(e){if(current())this.requestError.set(message(e));}finally{if(current())this.selectionBusy.set(false);}
 }
 selectAction(a:BankAction){if(!this.auth.bankCan('unit')||this.busy()||this.choosing()||!this.actionEnabled(a))return;this.clearAction();this.action.set(a);this.error.set(null);this.success.set(null);}
 actionEnabled(a:BankAction){
   const d=this.detail(),r=this.request();
   if(!d||!this.auth.bankCan('unit')||!availableActions(d.unit,this.auth.bankCapabilities()).includes(a))return false;
   if(a==='Reserve')return !!r&&r.request.status==='AwaitingBank'&&this.requestAccess.requestCan('bankDetail')&&!r.admissionChanged&&d.tests.some(t=>t.requestGuid===r.request.guid&&t.conclusion==='Accepted')&&r.items.some(i=>i.productCode===d.unit.productCode);
   return true;
 }
 async apply(){const d=this.detail(),a=this.action();if(!d||!a||!this.scope.isCurrent()||!this.actionEnabled(a)||this.busy()||this.choosing())return;const seq=this.seq;this.error.set(null);this.success.set(null);
  try{if(!this.reason.trim())throw new Error('شرح اقدام مستند الزامی است.');if(!this.actionEnabled(a))throw new Error('درخواست و نتیجه آزمایش مرتبط را بررسی کنید.');const r=this.request();const thaw=a==='StartThaw'||a==='FinishThaw';if(thaw&&!this.method.trim())throw new Error('روش ذوب ثبت‌شده لازم است.');if(a==='FinishThaw'&&(this.temperature===null||!Number.isFinite(this.temperature)))throw new Error('دمای اندازه‌گیری‌شده لازم است.');const expiry=a==='FinishThaw'?toUtc(this.effectiveExpiry.date,this.effectiveExpiry.time):null;if(!window.confirm(this.actionLabels[a]+' ثبت شود؟'))return;
   this.busy.set(true);await this.api.action({guid:d.unit.guid,version:d.unit.version,action:a,requestGuid:a==='Reserve'?r?.request.guid:null,requestVersion:a==='Reserve'?r?.version:null,reason:this.reason,method:thaw?this.method:null,temperature:a==='FinishThaw'?this.temperature:null,effectiveExpiry:expiry});if(!this.current(seq))return;this.action.set(null);const refresh=this.load(a==='Unreserve'?null:r?.request.guid);const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set('عملیات ثبت شد: '+this.actionLabels[a]);
  }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async saveLab(){const d=this.detail(),r=this.request();if(!d||!r||!this.scope.isCurrent()||!this.auth.bankCan('test')||!this.canLab()||this.busy()||this.choosing())return;const seq=this.seq;this.error.set(null);this.success.set(null);
  try{const l=this.lab;if(!l.sampleReference.trim()||!l.secondSample||!l.labelGroup||!l.method.trim()||!l.reportReference.trim()||!l.conclusion||this.phases.some(p=>!l[p.key])||l.conclusion!=='Accepted'&&!l.notes.trim())throw new Error('تمام اطلاعات آزمایش و نتیجه مستند را وارد کنید.');if(!window.confirm('نتیجه ثبت‌شده آزمایش برای همین واحد و درخواست ذخیره شود؟'))return;
   this.busy.set(true);const payload:LabInput={...l,notes:l.notes||null,unitGuid:d.unit.guid,unitVersion:d.unit.version,requestGuid:r.request.guid,requestVersion:r.version};await this.api.lab(payload);if(!this.current(seq))return;this.lab=emptyLab();const refresh=this.load(r.request.guid);const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set('نتیجه آزمایش ثبت شد.');
  }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 export(){const d=this.detail();if(d&&this.auth.bankCan('unit')&&!this.busy())downloadCsv('hemo-bank-unit-'+d.unit.unitCode+'.csv',[['واحد','عملیات','وضعیت','زمان','شرح'],...d.events.map(e=>[d.unit.unitCode,BANK_ACTION[e.action]??e.action,UNIT_STATUS[e.newStatus],bankDateTime(e.occurredAt),e.reason])]);}
 print(){if(this.auth.bankCan('unit')&&this.detail()&&!this.busy())window.print();}
}
