import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { AdmissionPageAccess } from './admission-page-access';
import { Component,OnInit,OnDestroy,inject,input,signal } from '@angular/core';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AdmissionsService,CreateAdmission } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { isoToJalali,jalaliToIso,normalizeDigits } from '../../shared/jalali-date';
import { BLOOD_GROUPS,isNationalId,message } from '../../shared/admission-utils';
@Component({selector:'app-admission-create',standalone:true,providers:[HemoPageScope,HemoCompanyHttp,AdmissionsService,AdmissionPageAccess],imports:[ReactiveFormsModule,RouterLink,MatButtonModule,MatCheckboxModule,RequestStateComponent],templateUrl:'./admission-create.component.html'})
export class AdmissionCreateComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(AdmissionPageAccess);
 ngOnInit(){void this.auth.load();}
 ngOnDestroy(){this.scope.invalidate();this.form.reset();}
 canCreate(){return this.auth.can('create')&&this.auth.can('find')&&this.auth.can('detail');}
 readonly compact=input(false);
 private fb=inject(FormBuilder);private api=inject(AdmissionsService);private router=inject(Router);
 readonly bloodGroups=BLOOD_GROUPS;readonly busy=signal(false);readonly lookupBusy=signal(false);readonly error=signal<string|null>(null);readonly notice=signal<string|null>(null);
 readonly preview=signal(false);
 readonly form=this.fb.nonNullable.group({
   identificationType:['NationalId'],identificationNumber:[''],firstName:['',Validators.maxLength(100)],lastName:['',Validators.maxLength(100)],fatherName:['',Validators.maxLength(100)],birthDate:[''],gender:['Unknown'],mobile:['',Validators.maxLength(32)],
   hisNumber:['',[Validators.required,Validators.maxLength(64)]],ward:['',[Validators.required,Validators.maxLength(100)]],bedNumber:['',[Validators.required,Validators.maxLength(64)]],physician:['',[Validators.required,Validators.maxLength(100)]],admissionType:['Inpatient'],diagnosis:['',Validators.maxLength(500)],insurance:['',Validators.maxLength(100)],bloodGroup:[''],transfusionHistory:['Unknown'],allergy:[false],leukoreduced:[false],irradiated:[false],alloantibody:[false],notes:['',Validators.maxLength(2000)]
 });
 identityChanged(){this.notice.set(null);this.form.controls.identificationNumber.setValue('');}
 unknown(){this.form.controls.identificationType.setValue('Unknown');this.identityChanged();}
 async lookup(){
   if(!this.canCreate()||this.lookupBusy()||this.busy())return;
   const type=this.form.controls.identificationType.value;const id=normalizeDigits(this.form.controls.identificationNumber.value).trim();
   if(type==='Unknown')return;
   if(!id||(type==='NationalId'&&!isNationalId(id))){this.error.set('شناسه هویتی معتبر وارد کنید.');return;}
   this.error.set(null);this.notice.set(null);this.lookupBusy.set(true);
   try{const p=await this.api.find(type,id);if(!this.scope.isCurrent()||this.form.controls.identificationType.value!==type||normalizeDigits(this.form.controls.identificationNumber.value).trim()!==id)return;
     if(p){this.form.patchValue({firstName:p.firstName,lastName:p.lastName,fatherName:p.fatherName??'',birthDate:isoToJalali(p.birthDate),gender:p.gender,mobile:p.mobile??''});this.notice.set('پرونده هویتی در مرکز جاری یافت شد؛ پذیرش جدید برای همین بیمار ثبت می‌شود.');}
     else this.notice.set('پرونده‌ای با این شناسه در مرکز جاری یافت نشد. در صورت اطمینان از هویت، بیمار جدید ثبت کنید.');
   }catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.lookupBusy.set(false);}
 }
 async submit(){
  if(!this.canCreate()||this.busy()||this.lookupBusy())return;
  this.error.set(null);this.notice.set(null);this.form.markAllAsTouched();
  if(this.form.invalid){this.error.set('فیلدهای الزامی و محدودیت طول را بررسی کنید.');return;}
  const v=this.form.getRawValue();const id=normalizeDigits(v.identificationNumber).trim();const birth=v.birthDate?jalaliToIso(v.birthDate):null;
  if(v.identificationType!=='Unknown'&&(!v.firstName.trim()||!v.lastName.trim()||!birth||!id)){this.error.set('نام، نام خانوادگی، تاریخ تولد و شناسه هویتی الزامی است.');return;}
  if(v.identificationType==='NationalId'&&!isNationalId(id)){this.error.set('کد ملی نامعتبر است.');return;}
  if(v.birthDate&&!birth){this.error.set('تاریخ تولد جلالی معتبر نیست.');return;}
  const req:CreateAdmission={...v,identificationNumber:v.identificationType==='Unknown'?'':id,birthDate:birth,firstName:v.firstName.trim(),lastName:v.lastName.trim(),hisNumber:normalizeDigits(v.hisNumber).trim(),fatherName:v.fatherName.trim()||null,mobile:normalizeDigits(v.mobile).trim()||null,diagnosis:v.diagnosis.trim()||null,insurance:v.insurance.trim()||null,bloodGroup:v.bloodGroup||null,notes:v.notes.trim()||null};
  this.busy.set(true);
  try{const guid=await this.api.create(req);if(!this.scope.isCurrent())return;await this.router.navigate(['/admission/detail',guid],{queryParams:{created:1}});}
  catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}
 }
}
