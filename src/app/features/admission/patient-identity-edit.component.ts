import { Component,inject,input,output,signal,effect } from '@angular/core';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali,jalaliToIso,normalizeDigits } from '../../shared/jalali-date';
import { isNationalId,message } from '../../shared/admission-utils';
@Component({selector:'app-patient-identity-edit',standalone:true,imports:[ReactiveFormsModule,MatButtonModule,RequestStateComponent],template:`
<section class="panel"><div class="patient-title"><h2>اصلاح مشخصات هویتی بیمار</h2><button mat-stroked-button type="button" (click)="open.set(!open())">{{open()?'بستن':patient().identificationType==='Unknown'?'تعیین هویت بیمار':'ویرایش مشخصات'}}</button></div>
@if(open()){
<div class="notice warn">پس از اصلاح مشخصات، تطبیق هویت و بررسی سوابق قبلی باید مجدداً انجام شوند. تغییر شناسه قطعی و ادغام پرونده تکراری خودکار نیست.</div>
<form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
<label>نوع شناسه<select formControlName="identificationType"><option value="Unknown">مجهول‌الهویه</option><option value="NationalId">کد ملی</option><option value="Passport">گذرنامه</option></select></label>
<label>شناسه<input formControlName="identificationNumber" dir="ltr" maxlength="64"></label>
<label>نام<input formControlName="firstName" maxlength="100"></label><label>نام خانوادگی<input formControlName="lastName" maxlength="100"></label><label>نام پدر<input formControlName="fatherName" maxlength="100"></label><label>تاریخ تولد جلالی<input formControlName="birthDate" placeholder="۱۳۶۵/۰۲/۱۴" dir="ltr"></label>
<label>جنسیت<select formControlName="gender"><option value="Unknown">نامشخص</option><option value="Female">زن</option><option value="Male">مرد</option></select></label><label>تلفن همراه<input formControlName="mobile" maxlength="32" dir="ltr"></label>
<label class="wide">دلیل مستند اصلاح *<textarea formControlName="reason" rows="3" maxlength="2000"></textarea></label></div>
<app-request-state [loading]="busy()" [error]="error()"/><div class="actions"><button mat-flat-button class="primary-button" [disabled]="busy()||form.invalid">ثبت اصلاح هویت</button><button mat-stroked-button type="button" (click)="open.set(false)">انصراف</button></div></form>
}
</section>`})
export class PatientIdentityEditComponent{
 readonly patient=input.required<AdmissionView>();readonly saved=output<void>();readonly open=signal(false);readonly busy=signal(false);readonly error=signal<string|null>(null);
 private api=inject(AdmissionsService);private fb=inject(FormBuilder);
 readonly form=this.fb.nonNullable.group({identificationType:['Unknown'],identificationNumber:[''],firstName:['',Validators.required],lastName:['',Validators.required],fatherName:[''],birthDate:[''],gender:['Unknown'],mobile:[''],reason:['',[Validators.required,Validators.maxLength(2000)]]});
 constructor(){effect(()=>{const p=this.patient();this.form.patchValue({identificationType:p.identificationType,identificationNumber:p.identificationNumber,firstName:p.firstName,lastName:p.lastName,fatherName:p.fatherName??'',birthDate:isoToJalali(p.birthDate),gender:p.gender,mobile:p.mobile??'',reason:''});if(p.identificationType!=='Unknown'){this.form.controls.identificationType.disable();this.form.controls.identificationNumber.disable();}else{this.form.controls.identificationType.enable();this.form.controls.identificationNumber.enable();}});}
 async save(){if(this.busy()||this.form.invalid)return;this.error.set(null);const p=this.patient(),v=this.form.getRawValue(),birth=v.birthDate?jalaliToIso(v.birthDate):null,id=normalizeDigits(v.identificationNumber).trim();
   if((v.identificationType!=='Unknown'&&(!birth||!id))||(v.birthDate&&!birth)||(v.identificationType==='NationalId'&&!isNationalId(id))){this.error.set('شناسه و تاریخ تولد را بررسی کنید.');return;}
   if(!window.confirm('اصلاح مشخصات باعث نیاز به بررسی مجدد هویت و سوابق می‌شود. ثبت شود؟'))return;
   this.busy.set(true);try{await this.api.updateIdentity({...v,guid:p.guid,version:p.version,identificationNumber:id,birthDate:birth,mobile:normalizeDigits(v.mobile)||null,fatherName:v.fatherName||null});this.open.set(false);this.saved.emit();}
   catch(e){this.error.set(message(e));}finally{this.busy.set(false);}
 }
}
