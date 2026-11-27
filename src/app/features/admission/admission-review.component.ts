import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { AdmissionPageAccess } from './admission-page-access';
import { Subscription } from 'rxjs';
import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
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
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,AdmissionsService,AdmissionPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionPickerComponent],templateUrl:'./admission-review.component.html'})
export class AdmissionReviewComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(AdmissionPageAccess);
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);
 readonly kind=this.route.snapshot.data['kind'] as 'Identity'|'History'|'Clearance';
 readonly title=this.kind==='Identity'?'تطبیق دو شناسه هویتی و صحه‌گذاری مچ‌بند':this.kind==='History'?'استعلام سوابق ترانسفیوژن و واکنش‌های ناخواسته':'کنترل پیش‌نیازهای ترخیص بیمار';
 readonly steps=this.kind==='Identity'?IDENTITY:CLEARANCE;
 readonly patient=signal<AdmissionView|null>(null);readonly history=signal<AdmissionView[]>([]);readonly reviews=signal<AdmissionReview[]>([]);readonly checks=signal<boolean[]>(flagsFor(0));
 readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly label=label;readonly date=isoToJalali;notes='';private sequence=0;
 private query?:Subscription;
 private selectedGuid='';
 private initialized=false;
 private destroyed=false;
 private current(seq:number){return !this.destroyed&&this.scope.isCurrent()&&seq===this.sequence;}
 canOpen(){return this.auth.can('list')&&this.auth.can('detail')&&this.auth.can('reviews')&&(this.kind!=='History'||this.auth.can('history'));}
 async ngOnInit(){
   await this.auth.load();
   if(this.destroyed||!this.scope.isCurrent())return;
   this.initialized=true;
   this.query=this.route.queryParamMap.subscribe(params=>{
     const guid=params.get('guid')??'';
     if(guid===this.selectedGuid)return;
     this.saving.set(false);
     void this.loadPatient(guid);
   });
 }
 ngOnDestroy(){
   this.destroyed=true;this.query?.unsubscribe();this.scope.invalidate();++this.sequence;this.clearPatient();
 }
 private clearPatient(){
   this.patient.set(null);this.history.set([]);this.reviews.set([]);this.checks.set(flagsFor(0));this.notes='';
 }
 checked(index:number,value:boolean){if(this.canOpen()&&this.auth.can('review')&&!this.saving())this.checks.update(x=>x.map((v,i)=>i===index?value:v));}
 complete(){return maskFor(this.checks())===31;}
 async select(guid:string){
   if(!this.initialized||!this.canOpen()||this.saving())return;
   await this.loadPatient(guid);
 }
 private async loadPatient(guid:string):Promise<boolean>{
   const seq=++this.sequence;this.selectedGuid=guid;
   this.clearPatient();this.error.set(null);this.success.set(null);this.busy.set(false);
   if(!guid||!this.canOpen()||!this.scope.isCurrent())return false;
   this.busy.set(true);
   try{
     const [patient,reviews,history]=await Promise.all([this.api.get(guid),this.api.reviews(guid),this.kind==='History'?this.api.history(guid):Promise.resolve([])]);
     if(!this.current(seq))return false;
     if(patient.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه پرونده دریافتی مطابقت ندارد.');
     this.patient.set(patient);this.reviews.set(reviews);this.history.set(history);
     this.checks.set(flagsFor(this.kind==='Clearance'?patient.clearanceChecklist:0));
     this.notes=this.kind==='Clearance'?patient.clearanceNotes??'':'';
     return true;
   }catch(e){if(this.current(seq))this.error.set(message(e));return false;}
   finally{if(this.current(seq))this.busy.set(false);}
 }
 async save(outcome:string){
   const p=this.patient(),seq=this.sequence;
   if(!this.canOpen()||!this.auth.can('review')||!p||this.busy()||this.saving())return;
   const allowed=this.kind==='Identity'?['Verified','Mismatch']:this.kind==='History'?['Reviewed']:['Draft','Ready'];
   if(!allowed.includes(outcome))return;
   this.error.set(null);this.success.set(null);
   if((outcome==='Verified'||outcome==='Ready')&&!this.complete()){this.error.set('تمام موارد چک‌لیست را بررسی کنید.');return;}
   if((outcome==='Mismatch'||this.kind==='History')&&!this.notes.trim()){this.error.set('شرح بررسی یا مغایرت الزامی است.');return;}
   if(outcome==='Ready'&&(p.identityStatus!=='Verified'||!p.historyReviewedAt)){this.error.set('ابتدا تطبیق هویت و بررسی مستند سوابق را ثبت کنید.');return;}
   this.saving.set(true);
   let expected=seq;
   try{
     await this.api.review({guid:p.guid,kind:this.kind,outcome,checklist:this.kind==='History'?0:maskFor(this.checks()),notes:this.notes.trim()||null,version:p.version});
     if(!this.current(seq))return;
     const reload=this.loadPatient(p.guid);expected=this.sequence;
     const loaded=await reload;
     if(this.current(expected)){
       if(loaded)this.success.set('بررسی در پرونده ذخیره شد.');
       else this.error.set('بررسی ثبت شد، اما دریافت مجدد پرونده انجام نشد. پرونده را دوباره باز کنید.');
     }
   }catch(e){if(this.current(expected))this.error.set(message(e));}
   finally{if(this.current(expected))this.saving.set(false);}
 }
 print(){if(this.canOpen()&&this.patient()&&!this.busy()&&!this.saving())window.print();}
}
