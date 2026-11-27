import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import type { AdmissionCapabilities } from '../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionFilters,AdmissionPage,AdmissionsService,AdmissionView } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { AdmissionTableComponent } from './admission-table.component';
import { BLOOD_GROUPS,downloadCsv,fa,label,message } from '../../shared/admission-utils';
import { isoToJalali,normalizeDigits } from '../../shared/jalali-date';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,AdmissionsService],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionTableComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">پذیرش / پرونده‌ها</p><h1>فهرست بیماران بستری و رهگیری ایمنی خون</h1><p class="muted">جستجو و بررسی پرونده‌های مرکز جاری</p></section>
<section class="panel"><div class="patient-title"><h2>فیلتر بیماران</h2><a mat-button routerLink="/admission/stats">گزارش آماری</a></div>
<form class="form-grid" (ngSubmit)="load(1)"><label>جستجو بر اساس مشخصات<input name="search" [(ngModel)]="search" placeholder="نام، کد ملی، شماره پرونده یا بارکد"></label><label>بخش بستری<select name="ward" [(ngModel)]="ward"><option value="">همه بخش‌ها</option>@for(w of wards();track w){<option [value]="w">{{w}}</option>}</select></label><label>وضعیت هویت<select name="identity" [(ngModel)]="identity"><option value="">همه وضعیت‌ها</option><option value="Pending">در انتظار تطبیق</option><option value="Verified">تأیید شده</option><option value="Mismatch">عدم انطباق</option></select></label><label>گروه خونی<select name="blood" [(ngModel)]="blood"><option value="">همه گروه‌ها</option>@for(g of groups;track g){<option [value]="g">{{g}}</option>}</select></label><label>وضعیت بستری<select name="status" [(ngModel)]="status"><option value="">همه</option><option value="Active">بستری فعال</option><option value="ReadyForDischarge">آماده بررسی ترخیص</option></select></label><div class="actions"><button mat-flat-button class="primary-button" type="submit" [disabled]="busy()">جستجو</button><button mat-stroked-button type="button" (click)="reset()">بازنشانی</button></div></form></section>
<section class="panel"><div class="patient-title"><h2>پرونده‌ها — {{fa(page()?.totalCount??0)}} مورد</h2><button mat-stroked-button [disabled]="exporting()||!page()?.totalCount" (click)="exportRows()">خروجی CSV سازگار با اکسل</button></div>
<app-request-state [loading]="busy()||exporting()" [error]="error()"/>
@if(!busy()&&page()){<app-admission-table [rows]="page()?.data??[]" [showActions]="false"/><div class="pagination"><button mat-stroked-button [disabled]="!page()?.hasPreviousPage" (click)="load((page()?.pageNumber??1)-1)">قبلی</button><span>صفحه {{fa(page()?.pageNumber??1)}} از {{fa(page()?.totalPages??0)}}</span><button mat-stroked-button [disabled]="!page()?.hasNextPage" (click)="load((page()?.pageNumber??1)+1)">بعدی</button></div>}
</section>
} @else {<p role="alert">نقش یا نشست تغییر کرده است. <a routerLink="/">بازگشت به صفحه اصلی</a></p>}`})
export class AdmissionListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);
 private transport=inject(HemoCompanyHttp);
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);readonly page=signal<AdmissionPage|null>(null);readonly wards=signal<string[]>([]);readonly busy=signal(false);readonly exporting=signal(false);readonly error=signal<string|null>(null);
 readonly groups=BLOOD_GROUPS;readonly fa=fa;search='';ward='';identity='';blood='';status='';
 private applied:AdmissionFilters={};private sequence=0;
 ngOnInit(){if(!this.scope.isCurrent())return;const q=this.route.snapshot.queryParamMap;const status=q.get('status')??'',identity=q.get('identity')??'';this.status=['Active','ReadyForDischarge'].includes(status)?status:'';this.identity=['Pending','Verified','Mismatch'].includes(identity)?identity:'';void this.load(1);void this.loadWards();}
 ngOnDestroy(){this.scope.invalidate();++this.sequence;this.page.set(null);this.wards.set([]);}
 private async loadWards(){try{const caps=await firstValueFrom(this.transport.get<AdmissionCapabilities>('/Identity/PatientAdmission/Capabilities'));if(!this.scope.isCurrent()||caps?.stats!==true)return;const x=await this.api.stats();if(this.scope.isCurrent())this.wards.set(x.wards.map(w=>w.name));}catch{/* optional filter; no data or grant fallback */}}
 private filters():AdmissionFilters{return {search:normalizeDigits(this.search).trim(),ward:this.ward,identityStatus:this.identity,bloodGroup:this.blood,status:this.status};}
 async load(pageNumber:number){
  if(!this.scope.isCurrent())return;
  if(pageNumber===1)this.applied=this.filters();
  const seq=++this.sequence;this.busy.set(true);this.error.set(null);
  try{const page=await this.api.list({...this.applied,pageNumber,pageSize:20});if(this.scope.isCurrent()&&seq===this.sequence)this.page.set(page);}
  catch(e){if(this.scope.isCurrent()&&seq===this.sequence){this.error.set(message(e));this.page.set(null);}}finally{if(this.scope.isCurrent()&&seq===this.sequence)this.busy.set(false);}
 }
 reset(){this.search=this.ward=this.identity=this.blood=this.status='';void this.load(1);}
 async exportRows(){
  if(!this.scope.isCurrent()||this.exporting())return;this.exporting.set(true);this.error.set(null);
  const rows:AdmissionView[]=[];const filters={...this.applied,pageSize:100};let p=1;
  try{while(true){if(!this.scope.isCurrent())return;const x=await this.api.list({...filters,pageNumber:p});if(!this.scope.isCurrent())return;if(x.totalCount>10000)throw new Error('برای خروجی بیش از ۱۰٬۰۰۰ رکورد، فیلتر محدودتری انتخاب کنید.');rows.push(...x.data);if(!x.hasNextPage||p>=100)break;p++;}
   if(!this.scope.isCurrent())return;
   downloadCsv('hemo-admission.csv',[['نام','نام خانوادگی','شناسه','شماره پرونده','بخش','تخت','گروه خونی','وضعیت هویت','تاریخ پذیرش'],...rows.map(x=>[x.firstName,x.lastName,x.identificationNumber,x.hisNumber,x.ward,x.bedNumber,x.bloodGroup,label(x.identityStatus),isoToJalali(x.admittedAt)])]);
  }catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.exporting.set(false);}
 }
}
