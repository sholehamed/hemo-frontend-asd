import { Component,OnInit,OnDestroy,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { RequestPageAccess } from './request-page-access';
import { AdmissionPageAccess } from '../admission/admission-page-access';
import { combineLatest,distinctUntilChanged,map,Subscription } from 'rxjs';
import { AdmissionsService,AdmissionView } from '../../core/api/admissions.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { AdmissionPickerComponent } from '../admission/admission-picker.component';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,label,message } from '../../shared/admission-utils';
import { isoToJalali,jalaliToIso,normalizeDigits } from '../../shared/jalali-date';
import { RequestInput,RequestForm,RequestDetail,REQUEST_PRODUCTS,REQUEST_FORMS,PRIORITIES,blankClinical,submissionIssue,productLabel,formLabel,canEditRequest } from './blood-request-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodRequestsService,AdmissionsService,RequestPageAccess,AdmissionPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,AdmissionPickerComponent,RequestStateComponent],templateUrl:'./request-form.component.html',styleUrl:'./request-form.component.css'})
export class RequestFormComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(RequestPageAccess);readonly admissionAccess=inject(AdmissionPageAccess);private api=inject(BloodRequestsService);private admissions=inject(AdmissionsService);private router=inject(Router);private route=inject(ActivatedRoute);
 editGuid=this.route.snapshot.paramMap.get('guid');readonly source=signal<'Nurse'|'Doctor'>(this.route.snapshot.data['source']==='Doctor'?'Doctor':'Nurse');
 private readonly editMode=signal(!!this.editGuid);
 readonly allowed=computed(()=>this.scope.isCurrent()&&this.auth.requestCan('detail')&&this.admissionAccess.can('detail')&&(this.editMode()?this.auth.requestCan('edit'):this.admissionAccess.can('list')&&this.auth.requestCan(this.source()==='Doctor'?'doctorCreate':'nurseCreate')));
 readonly forms=computed(()=>REQUEST_FORMS.filter(x=>x.source==='Both'||x.source===this.source()));
 readonly patient=signal<AdmissionView|null>(null);readonly existing=signal<RequestDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly step=signal(1);readonly ready=signal(false);readonly persistedGuid=signal<string|null>(null);readonly saved=signal<string|null>(null);
 readonly groups=BLOOD_GROUPS;readonly products=REQUEST_PRODUCTS;readonly priorities=Object.entries(PRIORITIES);readonly productLabel=productLabel;readonly formLabel=formLabel;readonly label=label;readonly date=isoToJalali;
 readonly tri=[{value:null,label:'نامشخص'},{value:true,label:'بله'},{value:false,label:'خیر'}];
 readonly steps=['انتخاب بیمار و فرم','اقلام و اطلاعات بالینی','بازبینی و ثبت'];
 draft:RequestInput={patientAdmissionGuid:'',clientRequestId:'',formType:'General',priority:'Routine',items:[],clinical:blankClinical()};
 sampleDate='';sampleTime='';neededDate='';neededTime='';surgeryDate='';
 private seq=0;private params?:Subscription;
 private newClientRequestId():string{
   const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
   const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
   return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 }
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private resetDraft(){
   this.patient.set(null);this.existing.set(null);this.persistedGuid.set(null);this.saved.set(null);this.ready.set(false);this.step.set(1);this.error.set(null);this.busy.set(false);
   this.draft={patientAdmissionGuid:'',clientRequestId:'',formType:'General',priority:'Routine',items:[],clinical:blankClinical()};
   this.sampleDate=this.sampleTime=this.neededDate=this.neededTime=this.surgeryDate='';
 }
 async ngOnInit(){
   await Promise.all([this.auth.load(),this.admissionAccess.load()]);if(!this.scope.isCurrent())return;
   this.params=combineLatest([this.route.paramMap,this.route.queryParamMap]).pipe(
     map(([p,q])=>({guid:p.get('guid'),admission:p.get('guid')?null:q.get('admission')})),
     distinctUntilChanged((a,b)=>a.guid===b.guid&&a.admission===b.admission)
   ).subscribe(p=>{
     ++this.seq;this.resetDraft();this.editGuid=p.guid;this.editMode.set(!!this.editGuid);
     this.source.set(this.route.snapshot.data['source']==='Doctor'?'Doctor':'Nurse');
     if(!this.allowed())return;
     if(this.editGuid)void this.loadEdit(this.editGuid);
     else{
       this.draft.clientRequestId=this.newClientRequestId();this.ready.set(true);
       if(p.admission)void this.selectPatient(p.admission);
     }
   });
 }
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.seq;this.resetDraft();}
 async loadEdit(guid:string){
   if(!this.allowed()||!this.editGuid||guid!==this.editGuid)return;
   const seq=++this.seq;this.busy.set(true);this.ready.set(false);this.error.set(null);
   try{
     const x=await this.api.get(guid);if(!this.current(seq))return;
     if(x.request.guid.toLowerCase()!==guid.toLowerCase()||!x.request.owned||!canEditRequest(x.request.status)){this.error.set('این درخواست در وضعیت قابل ویرایش نیست یا به شما تعلق ندارد.');return;}
     const p=await this.admissions.get(x.request.patientAdmissionGuid);if(!this.current(seq))return;
     if(p.guid.toLowerCase()!==x.request.patientAdmissionGuid.toLowerCase()||p.status!=='Active'){this.error.set('پذیرش فعال و مطابق درخواست یافت نشد.');return;}
     this.source.set(x.request.source);this.existing.set(x);this.draft={patientAdmissionGuid:x.request.patientAdmissionGuid,clientRequestId:x.clientRequestId,formType:x.request.formType,priority:x.request.priority,items:x.items.map(i=>({...i})),clinical:{...x.clinical,formDetails:{...x.clinical.formDetails}}};
     const d=this.draft.clinical.formDetails;this.sampleDate=isoToJalali(d.sampleAt);this.sampleTime=d.sampleAt?.slice(11,16)??'';this.neededDate=isoToJalali(d.neededAt);this.neededTime=d.neededAt?.slice(11,16)??'';this.surgeryDate=isoToJalali(d.surgeryAt);
     this.patient.set(p);this.ready.set(true);this.step.set(2);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async selectPatient(guid:string){
   if(!this.allowed()||!this.ready()||this.editGuid||this.existing()||this.persistedGuid()||this.busy())return;
   if(this.patient()?.guid===guid)return;
   // Never carry clinical fields or an idempotency key across patients.
   if(this.patient()&&!window.confirm('با تغییر بیمار، اطلاعات درخواست فعلی پاک می‌شود. ادامه؟'))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);
   try{
     const p=await this.admissions.get(guid);if(!this.current(seq))return;
     if(p.guid.toLowerCase()!==guid.toLowerCase()||p.status!=='Active'){this.error.set('فقط پذیرش فعال و مطابق شناسه قابل انتخاب است.');return;}
     this.draft={patientAdmissionGuid:p.guid,clientRequestId:this.newClientRequestId(),formType:'General',priority:'Routine',items:[],clinical:blankClinical()};
     this.sampleDate=this.sampleTime=this.neededDate=this.neededTime=this.surgeryDate='';
     this.patient.set(p);this.draft.clinical.diagnosis=p.diagnosis;this.draft.clinical.priorReaction=p.transfusionHistory==='Reaction'?true:null;this.draft.clinical.unexpectedAntibody=p.alloantibody?true:null;
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 chooseForm(form:RequestForm){if(!this.allowed()||!this.ready()||this.busy()||this.persistedGuid()||!this.forms().some(f=>f.code===form)||this.draft.formType===form)return;if(this.draft.items.length&&!window.confirm('با تغییر نوع فرم، اقلام و فیلدهای اختصاصی قبلی پاک می‌شوند. ادامه؟'))return;this.draft.formType=form;this.draft.items=[];this.draft.clinical.formDetails={};this.sampleDate=this.sampleTime=this.neededDate=this.neededTime=this.surgeryDate='';const product=REQUEST_FORMS.find(x=>x.code===form)?.product;if(product)this.draft.items.push({productCode:product,quantity:1,requestedBloodGroup:null,specialInstructions:null});if(form==='Emergency')this.draft.priority='Emergency';else if(this.draft.priority==='Emergency')this.draft.priority='Routine';}
 addLine(){if(!this.allowed()||!this.ready()||this.busy()||this.persistedGuid())return;const p=this.products.find(p=>!this.draft.items.some(x=>x.productCode===p.code));if(p)this.draft.items.push({productCode:p.code,quantity:1,requestedBloodGroup:null,specialInstructions:null});}
 removeLine(i:number){if(this.allowed()&&this.ready()&&!this.busy()&&!this.persistedGuid())this.draft.items.splice(i,1);}
 private combine(date:string,time:string){if(!date.trim()&&!time.trim())return null;const iso=jalaliToIso(date);const t=normalizeDigits(time.trim())||'00:00';if(!iso||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t))throw new Error('تاریخ یا ساعت ثبت‌شده معتبر نیست.');return iso+'T'+t+':00';}
 private prepare():RequestInput{
  const d=this.draft.clinical.formDetails;d.sampleAt=this.combine(this.sampleDate,this.sampleTime);d.neededAt=this.combine(this.neededDate,this.neededTime);
  d.surgeryAt=this.surgeryDate.trim()?this.combine(this.surgeryDate,'00:00'):null;
  if(!this.patient()||this.patient()!.guid.toLowerCase()!==this.draft.patientAdmissionGuid.toLowerCase())throw new Error('ابتدا پذیرش بیمار را انتخاب کنید.');
  if(this.draft.items.some(x=>!Number.isSafeInteger(x.quantity)||x.quantity<1||x.quantity>10000)||new Set(this.draft.items.map(x=>x.productCode)).size!==this.draft.items.length)throw new Error('نوع فرآورده تکراری یا تعداد واحد نامعتبر است.');
  if(!this.forms().some(f=>f.code===this.draft.formType))throw new Error('نوع فرم برای ثبت‌کننده مجاز نیست.');
  return structuredClone(this.draft);
 }
 next(){if(!this.allowed()||!this.ready()||this.busy()||this.persistedGuid())return;this.error.set(null);try{this.prepare();this.step.set(Math.min(3,this.step()+1));}catch(e){this.error.set(message(e));}}
 back(){if(!this.allowed()||!this.ready()||this.busy()||this.persistedGuid())return;this.error.set(null);this.step.set(Math.max(1,this.step()-1));}
 async save(submit:boolean){
   if(!this.allowed()||!this.ready()||this.busy()||this.persistedGuid()||(submit&&!this.auth.requestCan('submit')))return;
   this.error.set(null);const seq=++this.seq;
   try{
     const input=this.prepare();const existing=this.existing();
     if(submit){
       const issue=submissionIssue(input);if(issue)throw new Error(issue);
       if(this.patient()?.identityStatus!=='Verified')throw new Error('تطبیق هویت بیمار باید در پذیرش تأیید شود.');
       if(!window.confirm('درخواست پس از ارسال در کارتابل پزشک قرار می‌گیرد. ارسال شود؟'))return;
     }
     this.busy.set(true);
     let guid:string;
     if(existing){await this.api.update(existing.request.guid,existing.version,input);guid=existing.request.guid;}
     else guid=await this.api.create(input,this.source());
     if(!this.current(seq))return;
     // A confirmed write must not be blindly repeated after a failed submit or navigation.
     this.persistedGuid.set(guid);
     if(submit){
       const latest=await this.api.get(guid);if(!this.current(seq))return;
       if(latest.request.guid.toLowerCase()!==guid.toLowerCase()||!latest.request.owned||!canEditRequest(latest.request.status))throw new Error('وضعیت درخواست تغییر کرده است؛ جزئیات را بررسی کنید.');
       await this.api.transition({guid,version:latest.version,action:'Submit'});if(!this.current(seq))return;
     }
     this.saved.set(submit?'درخواست برای پزشک ارسال شد.':'پیش‌نویس ذخیره شد.');
     await this.router.navigate(['/hemo/requests/detail',guid]);
   }catch(e){
     if(this.current(seq))this.error.set(this.persistedGuid()?'درخواست ذخیره شد؛ نتیجه ارسال یا وضعیت فعلی را در جزئیات بررسی کنید. '+message(e):message(e));
   }finally{if(this.current(seq))this.busy.set(false);}
 }
}
