import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { AdmissionPageAccess } from './admission-page-access';
import { Subscription } from 'rxjs';
import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { PatientIdentityEditComponent } from './patient-identity-edit.component';
import { WristbandComponent } from './wristband.component';
import { label,message } from '../../shared/admission-utils';
import { isoToJalali } from '../../shared/jalali-date';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,AdmissionsService,AdmissionPageAccess],imports:[RouterLink,ReactiveFormsModule,MatButtonModule,RequestStateComponent,WristbandComponent,PatientIdentityEditComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">پذیرش / جزئیات</p><h1>پرونده پذیرش و مچ‌بند</h1>@if(auth.can('list')){<a mat-button routerLink="/admission/list">بازگشت به فهرست</a>}@else{<a mat-button routerLink="/">بازگشت به صفحه اصلی</a>}</section>
<app-request-state [loading]="busy()" [error]="error()"/>
@if(success()){<div class="notice success">{{success()}}</div>}
@if(patient();as p){
<section class="panel"><div class="patient-title"><h2>{{p.firstName}} {{p.lastName}} <span class="status-pill" [class]="p.identityStatus">{{label(p.identityStatus)}}</span></h2><span class="mono">{{p.hisNumber}}</span></div>
<div class="detail-grid" style="margin-top:12px"><div><small>نوع شناسه</small>{{label(p.identificationType)}}</div><div><small>شناسه هویتی</small><span class="mono">{{p.identificationNumber}}</span></div><div><small>تاریخ تولد</small>{{date(p.birthDate)||'نامشخص'}}</div><div><small>جنسیت</small>{{label(p.gender)}}</div><div><small>تاریخ پذیرش</small>{{date(p.admittedAt)}}</div><div><small>گروه خونی ثبت‌شده</small>{{p.bloodGroup||'نامشخص'}}</div><div><small>بخش / تخت</small>{{p.ward}} / {{p.bedNumber}}</div><div><small>پزشک معالج</small>{{p.physician}}</div><div><small>وضعیت</small>{{label(p.status)}}</div></div>
@if(p.allergy||p.alloantibody||p.transfusionHistory==='Reaction'){<div class="notice warn">هشدار سابقه: اطلاعات ثبت‌شده را پیش از اقدام بررسی کنید.</div>}
<!-- Other clinical destinations will be reconnected as their routes become active. -->
</section>
<app-wristband [patient]="p"/>
@if(auth.can('identity')){<app-patient-identity-edit [patient]="p" (saved)="identitySaved()"/>}
@if(auth.can('update')){<section class="panel"><h2>ویرایش اطلاعات بستری</h2><form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid"><label>بخش *<input formControlName="ward"></label><label>شماره تخت *<input formControlName="bedNumber"></label><label>پزشک *<input formControlName="physician"></label><label>بیمه<input formControlName="insurance"></label><label class="wide">تشخیص<textarea formControlName="diagnosis" rows="2"></textarea></label><label class="wide">توضیحات<textarea formControlName="notes" rows="2"></textarea></label></div><div class="actions"><button mat-flat-button class="primary-button" [disabled]="busy()||form.invalid">ذخیره تغییرات</button><button mat-stroked-button type="button" (click)="load()">دریافت مجدد</button></div></form><p class="muted">ویرایش اطلاعات بستری، بررسی آمادگی ترخیص را نیازمند بازبینی می‌کند.</p></section>}
}
} @else {<p role="alert">نقش یا نشست تغییر کرده است. <a routerLink="/">بازگشت به صفحه اصلی</a></p>}
`})
export class AdmissionDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(AdmissionPageAccess);
 private params?:Subscription;private guid='';private sequence=0;
 private current(guid:string,seq:number){return this.scope.isCurrent()&&guid===this.guid&&seq===this.sequence;}
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);private fb=inject(FormBuilder);
 readonly patient=signal<AdmissionView|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly date=isoToJalali;readonly label=label;
 readonly form=this.fb.nonNullable.group({ward:['',Validators.required],bedNumber:['',Validators.required],physician:['',Validators.required],insurance:[''],diagnosis:[''],notes:['']});
 ngOnInit(){
   // Angular reuses the component for parameter-only navigation.
   this.params=this.route.paramMap.subscribe(params=>{
     const guid=params.get('guid')??'';
     if(guid===this.guid)return;
     this.guid=guid;this.success.set(null);this.patient.set(null);this.form.reset();
     void this.load();
   });
 }
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.sequence;this.patient.set(null);this.form.reset();}
 async load(){
   if(!this.scope.isCurrent()||!this.guid)return;
   const guid=this.guid,seq=++this.sequence;
   this.busy.set(true);this.error.set(null);this.patient.set(null);
   try{
     await this.auth.load();
     if(!this.current(guid,seq))return;
     if(!this.auth.can('detail')){this.error.set('مجوز مشاهده پرونده تأیید نشده است.');return;}
     const p=await this.api.get(guid);
     if(!this.current(guid,seq))return;
     if(p.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه پرونده دریافتی مطابقت ندارد.');
     this.patient.set(p);
     this.form.patchValue({ward:p.ward,bedNumber:p.bedNumber,physician:p.physician,insurance:p.insurance??'',diagnosis:p.diagnosis??'',notes:p.notes??''});
   }catch(e){if(this.current(guid,seq)){this.error.set(message(e));this.patient.set(null);}}
   finally{if(this.current(guid,seq))this.busy.set(false);}
 }
 async identitySaved(){
   if(!this.scope.isCurrent()||!this.patient()||this.patient()?.guid.toLowerCase()!==this.guid.toLowerCase())return;
   this.success.set('اصلاح هویت ثبت شد. بررسی هویت و سوابق را مجدداً انجام دهید.');await this.load();
 }
 async save(){
   const p=this.patient(),guid=this.guid,seq=this.sequence;
   if(!this.auth.can('update')||!p||p.guid.toLowerCase()!==guid.toLowerCase()||this.busy()||this.form.invalid)return;
   this.busy.set(true);this.error.set(null);this.success.set(null);
   try{
     const v=this.form.getRawValue();
     await this.api.update({...v,guid:p.guid,version:p.version,insurance:v.insurance||null,diagnosis:v.diagnosis||null,notes:v.notes||null});
     if(!this.current(guid,seq))return;
     this.success.set('تغییرات ثبت شد.');await this.load();
   }catch(e){if(this.current(guid,seq))this.error.set(message(e));}
   finally{if(this.current(guid,seq))this.busy.set(false);}
 }
}
