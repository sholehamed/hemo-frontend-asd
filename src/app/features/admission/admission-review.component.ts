import { AuthService } from '../../core/auth/auth.service';
import { Component,OnInit,inject,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView,AdmissionReview,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { AdmissionPickerComponent } from './admission-picker.component';
import { label,message,maskFor,flagsFor } from '../../shared/admission-utils';
import { isoToJalali } from '../../shared/jalali-date';
const IDENTITY=['نام، نام خانوادگی و تاریخ تولد از بیمار یا همراه قانونی پرسیده و با مدرک و پرونده تطبیق داده شد.','حداقل دو شناسه مستقل با مچ‌بند و پرونده بالینی مطابقت دارد.','خوانایی بارکد مچ‌بند با اسکنر بررسی شد.','برچسب‌های هشدار مطابق سیاست مصوب مرکز بررسی شد.','مچ‌بند طبق رویه مصوب مرکز به‌درستی الصاق شده است.'];
const CLEARANCE=['هویت با پرونده و مچ‌بند تطبیق داده شده است.','وضعیت مچ‌بند و هشدارهای ثبت‌شده بررسی شد.','سوابق فرآورده‌ها و موارد نیازمند پیگیری به‌صورت مستند بررسی شد.','در صورت گزارش واکنش، ارجاع و پیگیری بالینی بررسی شد.','مدارک، موارد ناقص و ارجاع‌های باز بررسی و ثبت شدند.'];
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionPickerComponent],templateUrl:'./admission-review.component.html'})
export class AdmissionReviewComponent implements OnInit{
 readonly auth=inject(AuthService);
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);
 readonly kind=this.route.snapshot.data['kind'] as 'Identity'|'History'|'Clearance';
 readonly title=this.kind==='Identity'?'تطبیق دو شناسه هویتی و صحه‌گذاری مچ‌بند':this.kind==='History'?'استعلام سوابق ترانسفیوژن و واکنش‌های ناخواسته':'کنترل پیش‌نیازهای ترخیص بیمار';
 readonly steps=this.kind==='Identity'?IDENTITY:CLEARANCE;
 readonly patient=signal<AdmissionView|null>(null);readonly history=signal<AdmissionView[]>([]);readonly reviews=signal<AdmissionReview[]>([]);readonly checks=signal<boolean[]>(flagsFor(0));
 readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly label=label;readonly date=isoToJalali;notes='';private sequence=0;
 ngOnInit(){const guid=this.route.snapshot.queryParamMap.get('guid');if(guid)void this.select(guid);}
 checked(index:number,value:boolean){this.checks.update(x=>x.map((v,i)=>i===index?value:v));}
 complete(){return maskFor(this.checks())===31;}
 async select(guid:string){
  const seq=++this.sequence;this.busy.set(true);this.error.set(null);this.success.set(null);this.patient.set(null);this.history.set([]);this.reviews.set([]);
  try{const [patient,reviews,history]=await Promise.all([this.api.get(guid),this.api.reviews(guid),this.kind==='History'?this.api.history(guid):Promise.resolve([])]);
   if(seq!==this.sequence)return;this.patient.set(patient);this.reviews.set(reviews);this.history.set(history);this.checks.set(flagsFor(this.kind==='Clearance'?patient.clearanceChecklist:0));this.notes=this.kind==='Clearance'?patient.clearanceNotes??'':'';
  }catch(e){if(seq===this.sequence)this.error.set(message(e));}finally{if(seq===this.sequence)this.busy.set(false);}
 }
 async save(outcome:string){
  const p=this.patient();if(!this.auth.can('review')||!p||this.saving())return;this.error.set(null);this.success.set(null);
  if((outcome==='Verified'||outcome==='Ready')&&!this.complete()){this.error.set('تمام موارد چک‌لیست را بررسی کنید.');return;}
  if((outcome==='Mismatch'||this.kind==='History')&&!this.notes.trim()){this.error.set('شرح بررسی یا مغایرت الزامی است.');return;}
  if(outcome==='Ready'&&(p.identityStatus!=='Verified'||!p.historyReviewedAt)){this.error.set('ابتدا تطبیق هویت و بررسی مستند سوابق را ثبت کنید.');return;}
  this.saving.set(true);
  try{await this.api.review({guid:p.guid,kind:this.kind,outcome,checklist:this.kind==='History'?0:maskFor(this.checks()),notes:this.notes.trim()||null,version:p.version});await this.select(p.guid);this.success.set('بررسی در پرونده ذخیره شد.');}
  catch(e){this.error.set(message(e));}finally{this.saving.set(false);}
 }
 print(){window.print();}
}
