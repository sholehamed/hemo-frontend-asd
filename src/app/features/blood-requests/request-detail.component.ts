import { Component,OnInit,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { message,label,fa } from '../../shared/admission-utils';
import { isoToJalali } from '../../shared/jalali-date';
import { RequestDetail,DecisionInput,PhysicianCompletion,REQUEST_STATUS_LABEL,PRIORITIES,SPECIAL_LABELS,productLabel,formLabel,canEditRequest } from './blood-request-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./request-detail.component.html'})
export class RequestDetailComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly bank=this.route.snapshot.data['bank']===true;readonly allowed=computed(()=>this.bank?this.auth.requestCan('bankDetail'):this.auth.requestCan('detail'));
 readonly detail=signal<RequestDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly editable=computed(()=>!this.bank&&this.auth.requestCan('edit')&&!!this.detail()?.request.owned&&canEditRequest(this.detail()!.request.status));
 readonly status=REQUEST_STATUS_LABEL;readonly priorities=PRIORITIES;readonly productLabel=productLabel;readonly formLabel=formLabel;readonly date=isoToJalali;readonly label=label;readonly fa=fa;
 readonly actionLabels:Record<string,string>={Submit:'ارسال',Approve:'تأیید پزشک',Return:'برگشت برای اصلاح',Reject:'رد درخواست',Cancel:'لغو'};
 readonly tri=(v:boolean|null)=>v===null?'نامشخص':v?'بله':'خیر';
 readonly special=computed(()=>Object.entries(this.detail()?.clinical.formDetails??{}).filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([k,v])=>({label:SPECIAL_LABELS[k]??k,value:typeof v==='boolean'?this.tri(v):typeof v==='string'&&['sampleAt','neededAt','surgeryAt'].includes(k)?isoToJalali(v)+(v.length>10?' '+v.slice(11,16):''):String(v)})));
 reason='';physician:PhysicianCompletion={diagnosis:'',indication:'',medicalCouncilNumber:'',notes:null,confirmed:false};
 ngOnInit(){const saved=this.route.snapshot.queryParamMap.get('saved');if(saved)this.success.set(saved==='submitted'?'درخواست برای پزشک ارسال شد.':'پیش‌نویس ذخیره شد.');if(this.allowed())void this.load();}
 async load(){this.busy.set(true);this.error.set(null);try{const d=await this.api.get(this.route.snapshot.paramMap.get('guid')??'',this.bank);this.detail.set(d);this.physician={diagnosis:d.clinical.diagnosis??'',indication:d.clinical.clinicalIndication??'',medicalCouncilNumber:'',notes:null,confirmed:false};this.reason='';}catch(e){this.detail.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async act(action:DecisionInput['action']){
  const d=this.detail();if(this.bank||!d||this.busy())return;this.error.set(null);this.success.set(null);
  const ownerAction=action==='Submit'||action==='Cancel';if(ownerAction&&(!d.request.owned||!this.auth.requestCan(action==='Submit'?'submit':'cancel')))return;if(!ownerAction&&!this.auth.requestCan('decide'))return;
  if(['Return','Reject','Cancel'].includes(action)&&!this.reason.trim()){this.error.set('شرح دلیل الزامی است.');return;}
  if(action==='Approve'&&(!this.physician.confirmed||!this.physician.diagnosis.trim()||!this.physician.indication.trim()||!this.physician.medicalCouncilNumber.trim())){this.error.set('نظر پزشک، شماره نظام پزشکی و تأیید صریح را تکمیل کنید.');return;}
  if(!window.confirm(this.actionLabels[action]+' درخواست ثبت شود؟'))return;
  this.busy.set(true);try{await this.api.transition({guid:d.request.guid,version:d.version,action,reason:this.reason.trim()||null,...(action==='Approve'?{physician:{...this.physician}}:{})});await this.load();this.success.set('عملیات ثبت شد: '+this.actionLabels[action]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}
 }
 print(){window.print();}
}
