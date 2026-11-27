import { Component,OnInit,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { AdmissionsService,AdmissionView } from '../../core/api/admissions.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { AdmissionPickerComponent } from '../admission/admission-picker.component';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,label,message } from '../../shared/admission-utils';
import { isoToJalali,jalaliToIso,normalizeDigits } from '../../shared/jalali-date';
import { RequestInput,RequestForm,RequestLine,RequestDetail,REQUEST_PRODUCTS,REQUEST_FORMS,PRIORITIES,blankClinical,submissionIssue,productLabel,formLabel,canEditRequest } from './blood-request-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,AdmissionPickerComponent,RequestStateComponent],templateUrl:'./request-form.component.html',styleUrl:'./request-form.component.css'})
export class RequestFormComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodRequestsService);private admissions=inject(AdmissionsService);private router=inject(Router);private route=inject(ActivatedRoute);
 readonly editGuid=this.route.snapshot.paramMap.get('guid');readonly source=signal<'Nurse'|'Doctor'>(this.route.snapshot.data['source']==='Doctor'?'Doctor':'Nurse');
 readonly allowed=computed(()=>this.editGuid?this.auth.requestCan('edit'):this.source()==='Doctor'?this.auth.requestCan('doctorCreate'):this.auth.requestCan('nurseCreate'));
 readonly forms=computed(()=>REQUEST_FORMS.filter(x=>x.source==='Both'||x.source===this.source()));
 readonly patient=signal<AdmissionView|null>(null);readonly existing=signal<RequestDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly step=signal(1);readonly ready=signal(!this.editGuid);
 readonly groups=BLOOD_GROUPS;readonly products=REQUEST_PRODUCTS;readonly priorities=Object.entries(PRIORITIES);readonly productLabel=productLabel;readonly formLabel=formLabel;readonly label=label;readonly date=isoToJalali;
 readonly tri=[{value:null,label:'نامشخص'},{value:true,label:'بله'},{value:false,label:'خیر'}];
 readonly steps=['انتخاب بیمار و فرم','اقلام و اطلاعات بالینی','بازبینی و ثبت'];
 draft:RequestInput={patientAdmissionGuid:'',clientRequestId:'',formType:'General',priority:'Routine',items:[],clinical:blankClinical()};
 sampleDate='';sampleTime='';neededDate='';neededTime='';surgeryDate='';
 private seq=0;
 ngOnInit(){if(!this.allowed())return;if(this.editGuid){void this.loadEdit(this.editGuid);}else{this.draft.clientRequestId=crypto.randomUUID();const patient=this.route.snapshot.queryParamMap.get('admission');if(patient)void this.selectPatient(patient);}}
 async loadEdit(guid:string){this.busy.set(true);this.error.set(null);try{const x=await this.api.get(guid);if(!x.request.owned||!canEditRequest(x.request.status)){this.error.set('این درخواست در وضعیت قابل ویرایش نیست یا به شما تعلق ندارد.');return;}this.source.set(x.request.source);this.existing.set(x);this.draft={patientAdmissionGuid:x.request.patientAdmissionGuid,clientRequestId:x.clientRequestId,formType:x.request.formType,priority:x.request.priority,items:x.items.map(i=>({...i})),clinical:{...x.clinical,formDetails:{...x.clinical.formDetails}}};const d=this.draft.clinical.formDetails;this.sampleDate=isoToJalali(d.sampleAt);this.sampleTime=d.sampleAt?.slice(11,16)??'';this.neededDate=isoToJalali(d.neededAt);this.neededTime=d.neededAt?.slice(11,16)??'';this.surgeryDate=isoToJalali(d.surgeryAt);this.patient.set(await this.admissions.get(x.request.patientAdmissionGuid));this.ready.set(true);this.step.set(2);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async selectPatient(guid:string){if(this.editGuid||this.existing()||this.busy())return;const seq=++this.seq;this.busy.set(true);this.error.set(null);try{const p=await this.admissions.get(guid);if(seq!==this.seq)return;if(p.status!=='Active'){this.error.set('فقط پذیرش فعال قابل انتخاب است.');return;}this.patient.set(p);this.draft.patientAdmissionGuid=p.guid;this.draft.clinical.diagnosis=p.diagnosis;this.draft.clinical.priorReaction=p.transfusionHistory==='Reaction'?true:null;this.draft.clinical.unexpectedAntibody=p.alloantibody?true:null;}catch(e){this.error.set(message(e));}finally{if(seq===this.seq)this.busy.set(false);}}
 chooseForm(form:RequestForm){if(this.draft.formType===form)return;if(this.draft.items.length&&!window.confirm('با تغییر نوع فرم، اقلام و فیلدهای اختصاصی قبلی پاک می‌شوند. ادامه؟'))return;this.draft.formType=form;this.draft.items=[];this.draft.clinical.formDetails={};this.sampleDate=this.sampleTime=this.neededDate=this.neededTime=this.surgeryDate='';const product=REQUEST_FORMS.find(x=>x.code===form)?.product;if(product)this.draft.items.push({productCode:product,quantity:1,requestedBloodGroup:null,specialInstructions:null});if(form==='Emergency')this.draft.priority='Emergency';else if(this.draft.priority==='Emergency')this.draft.priority='Routine';}
 addLine(){const p=this.products.find(p=>!this.draft.items.some(x=>x.productCode===p.code));if(p)this.draft.items.push({productCode:p.code,quantity:1,requestedBloodGroup:null,specialInstructions:null});}
 removeLine(i:number){this.draft.items.splice(i,1);}
 private combine(date:string,time:string){if(!date.trim()&&!time.trim())return null;const iso=jalaliToIso(date);const t=normalizeDigits(time.trim())||'00:00';if(!iso||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t))throw new Error('تاریخ یا ساعت ثبت‌شده معتبر نیست.');return iso+'T'+t+':00';}
 private prepare():RequestInput{
  const d=this.draft.clinical.formDetails;d.sampleAt=this.combine(this.sampleDate,this.sampleTime);d.neededAt=this.combine(this.neededDate,this.neededTime);
  d.surgeryAt=this.surgeryDate.trim()?this.combine(this.surgeryDate,'00:00'):null;
  if(!this.patient())throw new Error('ابتدا پذیرش بیمار را انتخاب کنید.');
  if(this.draft.items.some(x=>!Number.isSafeInteger(x.quantity)||x.quantity<1||x.quantity>10000)||new Set(this.draft.items.map(x=>x.productCode)).size!==this.draft.items.length)throw new Error('نوع فرآورده تکراری یا تعداد واحد نامعتبر است.');
  return structuredClone(this.draft);
 }
 next(){this.error.set(null);try{this.prepare();this.step.set(Math.min(3,this.step()+1));}catch(e){this.error.set(message(e));}}
 back(){this.error.set(null);this.step.set(Math.max(1,this.step()-1));}
 async save(submit:boolean){
  if(!this.allowed()||!this.ready()||this.busy())return;this.error.set(null);let savedGuid:string|null=null;
  try{const input=this.prepare();if(submit){const issue=submissionIssue(input);if(issue)throw new Error(issue);if(this.patient()?.identityStatus!=='Verified')throw new Error('تطبیق هویت بیمار باید در پذیرش تأیید شود.');if(!window.confirm('درخواست پس از ارسال در کارتابل پزشک قرار می‌گیرد. ارسال شود؟'))return;}
   this.busy.set(true);const existing=this.existing();if(existing){await this.api.update(existing.request.guid,existing.version,input);savedGuid=existing.request.guid;}else{savedGuid=await this.api.create(input,this.source());}
   if(submit){const current=await this.api.get(savedGuid);this.existing.set(current);await this.api.transition({guid:savedGuid,version:current.version,action:'Submit'});}
   await this.router.navigate(['/hemo/requests/detail',savedGuid],{queryParams:{saved:submit?'submitted':'draft'}});
  }catch(e){this.error.set(message(e));if(savedGuid){try{this.existing.set(await this.api.get(savedGuid));}catch{/* retained idempotency key */}}}finally{this.busy.set(false);}
 }
}
