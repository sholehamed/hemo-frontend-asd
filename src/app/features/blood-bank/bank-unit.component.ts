import { Component,OnInit,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel,RequestDetail,RequestPage } from '../blood-requests/blood-request-model';
import { UnitDetail,BankAction,BANK_ACTION,UNIT_STATUS,LAB_RESULTS,ASSESSMENTS,CONCLUSIONS,SECOND_SAMPLE,availableActions,statusLabel,LabInput } from './bank-model';
import { bankDateTime,toUtc } from './bank-time';
const emptyLab=()=>({sampleReference:'',secondSample:'',labelGroup:'',method:'',immediateSpin:'',phase37:'',ahg:'',dat:'',antibodyScreen:'',reportReference:'',conclusion:'',notes:''});
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-unit.component.html',styleUrl:'./bank-unit.component.css'})
export class BankUnitComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);private requests=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly guid=this.route.snapshot.paramMap.get('guid')??'';
 readonly detail=signal<UnitDetail|null>(null);readonly request=signal<RequestDetail|null>(null);readonly queue=signal<RequestPage|null>(null);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly requestError=signal<string|null>(null);readonly queueBusy=signal(false);
 readonly action=signal<BankAction|null>(null);readonly actions=computed(()=>{const u=this.detail()?.unit;return u?availableActions(u,this.auth.bankCapabilities()):[];});
 readonly canLab=computed(()=>{const u=this.detail()?.unit,r=this.request();return !!u&&!!r&&this.auth.bankCan('test')&&!u.expired&&!r.admissionChanged&&['Available','Reserved','Ready'].includes(u.status)&&(!u.requestGuid||u.requestGuid===r.request.guid)&&r.items.some(x=>x.productCode===u.productCode);});
 readonly actionLabels=BANK_ACTION;readonly statuses=UNIT_STATUS;readonly resultLabels=LAB_RESULTS;readonly conclusions=CONCLUSIONS;readonly sampleLabels=SECOND_SAMPLE;readonly assessmentLabels=ASSESSMENTS;readonly results=Object.entries(LAB_RESULTS);readonly conclusionOptions=Object.entries(CONCLUSIONS);readonly sampleOptions=Object.entries(SECOND_SAMPLE);
 readonly product=productLabel;readonly label=statusLabel;readonly date=bankDateTime;readonly fa=fa;readonly groups=BLOOD_GROUPS;
 readonly phases:{key:'immediateSpin'|'phase37'|'ahg'|'dat'|'antibodyScreen';label:string}[]=[{key:'immediateSpin',label:'فاز فوری (IS)'},{key:'phase37',label:'فاز ۳۷ درجه'},{key:'ahg',label:'فاز آنتی‌گلوبولین (AHG)'},{key:'dat',label:'Direct Coombs (DAT)'},{key:'antibodyScreen',label:'Antibody Screening'}];
 queueSearch='';reason='';method='';temperature:number|null=null;effectiveExpiry={date:'',time:''};lab=emptyLab();
 ngOnInit(){if(this.auth.bankCan('unit'))void this.load(this.route.snapshot.queryParamMap.get('request'));}
 async load(requestGuid?:string|null){if(!this.auth.bankCan('unit'))return;this.busy.set(true);this.error.set(null);try{const d=await this.api.unit(this.guid);this.detail.set(d);const id=d.unit.requestGuid??requestGuid??this.request()?.request.guid;if(id&&this.auth.requestCan('bankDetail'))await this.choose(id);else this.request.set(null);}catch(e){this.detail.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async loadQueue(pageNumber=1){if(!this.auth.requestCan('bankQueue'))return;this.queueBusy.set(true);this.requestError.set(null);try{this.queue.set(await this.requests.bank({search:this.queueSearch,pageNumber,pageSize:20}));}catch(e){this.requestError.set(message(e));}finally{this.queueBusy.set(false);}}
 async choose(id:string){const u=this.detail()?.unit;if(u?.requestGuid&&u.requestGuid!==id)return;this.request.set(null);this.requestError.set(null);this.lab=emptyLab();if(!id)return;try{const r=await this.requests.get(id,true);this.request.set(r);}catch(e){this.requestError.set(message(e));}}
 selectAction(a:BankAction){this.action.set(a);this.reason=this.method='';this.temperature=null;this.effectiveExpiry={date:'',time:''};this.error.set(null);this.success.set(null);}
 actionEnabled(a:BankAction){const r=this.request();if(a==='Reserve')return !!r&&!r.admissionChanged&&!!this.detail()?.tests.some(t=>t.requestGuid===r.request.guid&&t.conclusion==='Accepted')&&r.items.some(i=>i.productCode===this.detail()?.unit.productCode);return true;}
 async apply(){const d=this.detail(),a=this.action();if(!d||!a||!this.actions().includes(a)||this.busy())return;this.error.set(null);this.success.set(null);
  try{if(!this.reason.trim())throw new Error('شرح اقدام مستند الزامی است.');if(!this.actionEnabled(a))throw new Error('درخواست و نتیجه آزمایش مرتبط را بررسی کنید.');const r=this.request();const thaw=a==='StartThaw'||a==='FinishThaw';if(thaw&&!this.method.trim())throw new Error('روش ذوب ثبت‌شده لازم است.');if(a==='FinishThaw'&&(this.temperature===null||!Number.isFinite(this.temperature)))throw new Error('دمای اندازه‌گیری‌شده لازم است.');const expiry=a==='FinishThaw'?toUtc(this.effectiveExpiry.date,this.effectiveExpiry.time):null;if(!window.confirm(this.actionLabels[a]+' ثبت شود؟'))return;
   this.busy.set(true);await this.api.action({guid:d.unit.guid,version:d.unit.version,action:a,requestGuid:a==='Reserve'?r?.request.guid:null,requestVersion:a==='Reserve'?r?.version:null,reason:this.reason,method:thaw?this.method:null,temperature:a==='FinishThaw'?this.temperature:null,effectiveExpiry:expiry});this.action.set(null);this.success.set('عملیات ثبت شد: '+this.actionLabels[a]);await this.load(a==='Unreserve'?null:r?.request.guid);
  }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}
 }
 async saveLab(){const d=this.detail(),r=this.request();if(!d||!r||!this.canLab()||this.busy())return;this.error.set(null);this.success.set(null);
  try{const l=this.lab;if(!l.sampleReference.trim()||!l.secondSample||!l.labelGroup||!l.method.trim()||!l.reportReference.trim()||!l.conclusion||this.phases.some(p=>!l[p.key])||l.conclusion!=='Accepted'&&!l.notes.trim())throw new Error('تمام اطلاعات آزمایش و نتیجه مستند را وارد کنید.');if(!window.confirm('نتیجه ثبت‌شده آزمایش برای همین واحد و درخواست ذخیره شود؟'))return;
   this.busy.set(true);const payload:LabInput={...l,notes:l.notes||null,unitGuid:d.unit.guid,unitVersion:d.unit.version,requestGuid:r.request.guid,requestVersion:r.version};await this.api.lab(payload);this.lab=emptyLab();this.success.set('نتیجه آزمایش ثبت شد.');await this.load(r.request.guid);
  }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}
 }
 export(){const d=this.detail();if(d)downloadCsv('hemo-bank-unit-'+d.unit.unitCode+'.csv',[['واحد','عملیات','وضعیت','زمان','شرح'],...d.events.map(e=>[d.unit.unitCode,BANK_ACTION[e.action]??e.action,UNIT_STATUS[e.newStatus],bankDateTime(e.occurredAt),e.reason])]);}
 print(){window.print();}
}
