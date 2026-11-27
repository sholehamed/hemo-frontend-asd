import { Component,OnInit,OnDestroy,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { RequestPageAccess } from './request-page-access';
import { Subscription } from 'rxjs';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { message,label,fa } from '../../shared/admission-utils';
import { isoToJalali } from '../../shared/jalali-date';
import { RequestDetail,DecisionInput,PhysicianCompletion,REQUEST_STATUS_LABEL,PRIORITIES,SPECIAL_LABELS,productLabel,formLabel,canEditRequest } from './blood-request-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodRequestsService,RequestPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./request-detail.component.html'})
export class RequestDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(RequestPageAccess);private api=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly bank=this.route.snapshot.data['bank']===true;readonly allowed=computed(()=>this.bank?this.auth.requestCan('bankDetail'):this.auth.requestCan('detail'));
 readonly detail=signal<RequestDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly editable=computed(()=>!this.bank&&this.auth.requestCan('edit')&&!!this.detail()?.request.owned&&canEditRequest(this.detail()!.request.status));
 readonly status=REQUEST_STATUS_LABEL;readonly priorities=PRIORITIES;readonly productLabel=productLabel;readonly formLabel=formLabel;readonly date=isoToJalali;readonly label=label;readonly fa=fa;
 readonly actionLabels:Record<string,string>={Submit:'ارسال',Approve:'تأیید پزشک',Return:'برگشت برای اصلاح',BankReturn:'برگشت از بانک خون',Reject:'رد درخواست',Cancel:'لغو'};
 readonly tri=(v:boolean|null)=>v===null?'نامشخص':v?'بله':'خیر';
 readonly special=computed(()=>Object.entries(this.detail()?.clinical.formDetails??{}).filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([k,v])=>({label:SPECIAL_LABELS[k]??k,value:typeof v==='boolean'?this.tri(v):typeof v==='string'&&['sampleAt','neededAt','surgeryAt'].includes(k)?isoToJalali(v)+(v.length>10?' '+v.slice(11,16):''):String(v)})));
 reason='';physician:PhysicianCompletion={diagnosis:'',indication:'',medicalCouncilNumber:'',notes:null,confirmed:false};
 private params?:Subscription;private guid='';private seq=0;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clear(){this.detail.set(null);this.success.set(null);this.error.set(null);this.reason='';this.physician={diagnosis:'',indication:'',medicalCouncilNumber:'',notes:null,confirmed:false};}
 async ngOnInit(){
   await this.auth.load();if(!this.scope.isCurrent())return;
   this.params=this.route.paramMap.subscribe(p=>{
     this.guid=p.get('guid')??'';++this.seq;this.clear();this.busy.set(false);
     if(this.allowed()&&this.guid)void this.load();
   });
 }
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.seq;this.clear();}
 async load(){
   if(!this.allowed()||!this.scope.isCurrent()||!this.guid)return;
   const seq=++this.seq;const guid=this.guid;this.clear();this.busy.set(true);
   try{
     const d=await this.api.get(guid,this.bank);if(!this.current(seq))return;
     if(d.request.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه پاسخ با درخواست انتخاب‌شده مطابقت ندارد.');
     this.detail.set(d);this.physician={diagnosis:d.clinical.diagnosis??'',indication:d.clinical.clinicalIndication??'',medicalCouncilNumber:'',notes:null,confirmed:false};
   }catch(e){if(this.current(seq)){this.detail.set(null);this.error.set(message(e));}}
   finally{if(this.current(seq))this.busy.set(false);}
 }
 async act(action:DecisionInput['action']){
   const d=this.detail();if(!this.scope.isCurrent()||!this.allowed()||this.bank||!d||this.busy())return;
   const status=d.request.status;
   if(action==='Submit'&&(!d.request.owned||!this.auth.requestCan('submit')||!canEditRequest(status)))return;
   if(action==='Cancel'&&(!d.request.owned||!this.auth.requestCan('cancel')||!['Draft','Returned','AwaitingDoctor'].includes(status)))return;
   if(['Approve','Return','Reject'].includes(action)&&(!this.auth.requestCan('decide')||status!=='AwaitingDoctor'))return;
   if(action==='Approve'&&d.admissionChanged)return;
   this.error.set(null);this.success.set(null);
   if(['Return','Reject','Cancel'].includes(action)&&!this.reason.trim()){this.error.set('شرح دلیل الزامی است.');return;}
   if(action==='Approve'&&(!this.physician.confirmed||!this.physician.diagnosis.trim()||!this.physician.indication.trim()||!this.physician.medicalCouncilNumber.trim())){this.error.set('نظر پزشک، شماره نظام پزشکی و تأیید صریح را تکمیل کنید.');return;}
   if(!window.confirm(this.actionLabels[action]+' درخواست ثبت شود؟'))return;
   const seq=++this.seq;this.busy.set(true);
   try{
     await this.api.transition({guid:d.request.guid,version:d.version,action,reason:this.reason.trim()||null,...(action==='Approve'?{physician:{...this.physician}}:{})});
     if(!this.current(seq))return;
     const reload=this.load();const reloadSeq=this.seq;await reload;
     if(this.current(reloadSeq))this.success.set('عملیات ثبت شد: '+this.actionLabels[action]);
   }catch(e){if(this.current(seq))this.error.set(message(e));}
   finally{if(this.current(seq))this.busy.set(false);}
 }
 print(){if(this.allowed()&&this.detail()&&!this.busy()&&this.scope.isCurrent())window.print();}
}
