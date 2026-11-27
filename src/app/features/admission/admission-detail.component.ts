import { AuthService } from '../../core/auth/auth.service';
import { Component,OnInit,inject,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { PatientIdentityEditComponent } from './patient-identity-edit.component';
import { WristbandComponent } from './wristband.component';
import { label,message } from '../../shared/admission-utils';
import { isoToJalali } from '../../shared/jalali-date';
@Component({standalone:true,imports:[RouterLink,ReactiveFormsModule,MatButtonModule,RequestStateComponent,WristbandComponent,PatientIdentityEditComponent],template:`
<section class="heading"><p class="eyebrow">پذیرش / جزئیات</p><h1>پرونده پذیرش و مچ‌بند</h1><a mat-button routerLink="/admission/list">بازگشت به فهرست</a></section>
<app-request-state [loading]="busy()" [error]="error()"/>
@if(success()){<div class="notice success">{{success()}}</div>}
@if(patient();as p){
<section class="panel"><div class="patient-title"><h2>{{p.firstName}} {{p.lastName}} <span class="status-pill" [class]="p.identityStatus">{{label(p.identityStatus)}}</span></h2><span class="mono">{{p.hisNumber}}</span></div>
<div class="detail-grid" style="margin-top:12px"><div><small>نوع شناسه</small>{{label(p.identificationType)}}</div><div><small>شناسه هویتی</small><span class="mono">{{p.identificationNumber}}</span></div><div><small>تاریخ تولد</small>{{date(p.birthDate)||'نامشخص'}}</div><div><small>جنسیت</small>{{label(p.gender)}}</div><div><small>تاریخ پذیرش</small>{{date(p.admittedAt)}}</div><div><small>گروه خونی ثبت‌شده</small>{{p.bloodGroup||'نامشخص'}}</div><div><small>بخش / تخت</small>{{p.ward}} / {{p.bedNumber}}</div><div><small>پزشک معالج</small>{{p.physician}}</div><div><small>وضعیت</small>{{label(p.status)}}</div></div>
@if(p.allergy||p.alloantibody||p.transfusionHistory==='Reaction'){<div class="notice warn">هشدار سابقه: اطلاعات ثبت‌شده را پیش از اقدام بررسی کنید.</div>}
<div class="actions">@if(auth.transferCan('list')){<a mat-stroked-button routerLink="/hemo/transfusion/records" [queryParams]="{admission:p.guid}">سوابق حواله و تزریق بیمار</a>}@if(auth.can('reviews')){<a mat-stroked-button routerLink="/admission/identity" [queryParams]="{guid:p.guid}">تطبیق هویت</a>}@if(auth.can('history')){<a mat-stroked-button routerLink="/admission/history" [queryParams]="{guid:p.guid}">بررسی سوابق</a>}@if(auth.can('reviews')){<a mat-stroked-button routerLink="/admission/discharge" [queryParams]="{guid:p.guid}">کنترل ترخیص</a>}@if(auth.requestCan('list')){<a mat-stroked-button routerLink="/hemo/requests" [queryParams]="{admission:p.guid}">درخواست‌های خون بیمار</a>}@if(auth.requestCan('nurseCreate')){<a mat-flat-button class="primary-button" routerLink="/hemo/requests/new" [queryParams]="{admission:p.guid}">ثبت درخواست خون</a>}@if(auth.requestCan('doctorCreate')){<a mat-flat-button class="primary-button" routerLink="/hemo/requests/orders" [queryParams]="{admission:p.guid}">ثبت دستور پزشک</a>}</div>
</section>
<app-wristband [patient]="p"/>
@if(auth.can('identity')){<app-patient-identity-edit [patient]="p" (saved)="identitySaved()"/>}
@if(auth.can('update')){<section class="panel"><h2>ویرایش اطلاعات بستری</h2><form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid"><label>بخش *<input formControlName="ward"></label><label>شماره تخت *<input formControlName="bedNumber"></label><label>پزشک *<input formControlName="physician"></label><label>بیمه<input formControlName="insurance"></label><label class="wide">تشخیص<textarea formControlName="diagnosis" rows="2"></textarea></label><label class="wide">توضیحات<textarea formControlName="notes" rows="2"></textarea></label></div><div class="actions"><button mat-flat-button class="primary-button" [disabled]="busy()||form.invalid">ذخیره تغییرات</button><button mat-stroked-button type="button" (click)="load()">دریافت مجدد</button></div></form><p class="muted">ویرایش اطلاعات بستری، بررسی آمادگی ترخیص را نیازمند بازبینی می‌کند.</p></section>}
}
`})
export class AdmissionDetailComponent implements OnInit{
 readonly auth=inject(AuthService);
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);private fb=inject(FormBuilder);
 readonly patient=signal<AdmissionView|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly date=isoToJalali;readonly label=label;
 readonly form=this.fb.nonNullable.group({ward:['',Validators.required],bedNumber:['',Validators.required],physician:['',Validators.required],insurance:[''],diagnosis:[''],notes:['']});
 ngOnInit(){if(this.route.snapshot.queryParamMap.get('created'))this.success.set('پرونده در سامانه ثبت شد. مچ‌بند آماده چاپ است.');void this.load();}
 async load(){this.busy.set(true);this.error.set(null);try{const p=await this.api.get(this.route.snapshot.paramMap.get('guid')??'');this.patient.set(p);this.form.patchValue({ward:p.ward,bedNumber:p.bedNumber,physician:p.physician,insurance:p.insurance??'',diagnosis:p.diagnosis??'',notes:p.notes??''});}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async identitySaved(){this.success.set('اصلاح هویت ثبت شد. بررسی هویت و سوابق را مجدداً انجام دهید.');await this.load();}
 async save(){const p=this.patient();if(!this.auth.can('update')||!p||this.busy()||this.form.invalid)return;this.busy.set(true);this.error.set(null);this.success.set(null);try{const v=this.form.getRawValue();await this.api.update({...v,guid:p.guid,version:p.version,insurance:v.insurance||null,diagnosis:v.diagnosis||null,notes:v.notes||null});this.success.set('تغییرات ثبت شد.');await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
