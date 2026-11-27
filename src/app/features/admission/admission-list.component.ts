import { AuthService } from '../../core/auth/auth.service';
import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionFilters,AdmissionPage,AdmissionsService,AdmissionView } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { AdmissionTableComponent } from './admission-table.component';
import { BLOOD_GROUPS,downloadCsv,fa,label,message } from '../../shared/admission-utils';
import { isoToJalali,normalizeDigits } from '../../shared/jalali-date';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionTableComponent],template:`
<section class="heading"><p class="eyebrow">پذیرش / پرونده‌ها</p><h1>فهرست بیماران بستری و رهگیری ایمنی خون</h1><p class="muted">جستجو و بررسی پرونده‌های مرکز جاری</p></section>
<section class="panel"><div class="patient-title"><h2>فیلتر بیماران</h2>@if(auth.can('create')){<a mat-flat-button class="primary-button" routerLink="/admission/new">＋ پذیرش بیمار</a>}</div>
<form class="form-grid" (ngSubmit)="load(1)"><label>جستجو بر اساس مشخصات<input name="search" [(ngModel)]="search" placeholder="نام، کد ملی، شماره پرونده یا بارکد"></label><label>بخش بستری<select name="ward" [(ngModel)]="ward"><option value="">همه بخش‌ها</option>@for(w of wards();track w){<option [value]="w">{{w}}</option>}</select></label><label>وضعیت هویت<select name="identity" [(ngModel)]="identity"><option value="">همه وضعیت‌ها</option><option value="Pending">در انتظار تطبیق</option><option value="Verified">تأیید شده</option><option value="Mismatch">عدم انطباق</option></select></label><label>گروه خونی<select name="blood" [(ngModel)]="blood"><option value="">همه گروه‌ها</option>@for(g of groups;track g){<option [value]="g">{{g}}</option>}</select></label><label>وضعیت بستری<select name="status" [(ngModel)]="status"><option value="">همه</option><option value="Active">بستری فعال</option><option value="ReadyForDischarge">آماده بررسی ترخیص</option></select></label><div class="actions"><button mat-flat-button class="primary-button" type="submit" [disabled]="busy()">جستجو</button><button mat-stroked-button type="button" (click)="reset()">بازنشانی</button></div></form></section>
<section class="panel"><div class="patient-title"><h2>پرونده‌ها — {{fa(page()?.totalCount??0)}} مورد</h2><button mat-stroked-button [disabled]="exporting()||!page()?.totalCount" (click)="exportRows()">خروجی CSV سازگار با اکسل</button></div>
<app-request-state [loading]="busy()||exporting()" [error]="error()"/>
@if(!busy()&&page()){<app-admission-table [rows]="page()?.data??[]"/><div class="pagination"><button mat-stroked-button [disabled]="!page()?.hasPreviousPage" (click)="load((page()?.pageNumber??1)-1)">قبلی</button><span>صفحه {{fa(page()?.pageNumber??1)}} از {{fa(page()?.totalPages??0)}}</span><button mat-stroked-button [disabled]="!page()?.hasNextPage" (click)="load((page()?.pageNumber??1)+1)">بعدی</button></div>}
</section>`})
export class AdmissionListComponent implements OnInit{
 readonly auth=inject(AuthService);
 private route=inject(ActivatedRoute);private api=inject(AdmissionsService);readonly page=signal<AdmissionPage|null>(null);readonly wards=signal<string[]>([]);readonly busy=signal(false);readonly exporting=signal(false);readonly error=signal<string|null>(null);
 readonly groups=BLOOD_GROUPS;readonly fa=fa;search='';ward='';identity='';blood='';status='';
 private applied:AdmissionFilters={};private sequence=0;
 ngOnInit(){const q=this.route.snapshot.queryParamMap;const status=q.get('status')??'',identity=q.get('identity')??'';this.status=['Active','ReadyForDischarge'].includes(status)?status:'';this.identity=['Pending','Verified','Mismatch'].includes(identity)?identity:'';void this.load(1);void this.api.stats().then(x=>this.wards.set(x.wards.map(w=>w.name))).catch(()=>{});}
 private filters():AdmissionFilters{return {search:normalizeDigits(this.search).trim(),ward:this.ward,identityStatus:this.identity,bloodGroup:this.blood,status:this.status};}
 async load(pageNumber:number){
  if(pageNumber===1)this.applied=this.filters();
  const seq=++this.sequence;this.busy.set(true);this.error.set(null);
  try{const page=await this.api.list({...this.applied,pageNumber,pageSize:20});if(seq===this.sequence)this.page.set(page);}
  catch(e){if(seq===this.sequence){this.error.set(message(e));this.page.set(null);}}finally{if(seq===this.sequence)this.busy.set(false);}
 }
 reset(){this.search=this.ward=this.identity=this.blood=this.status='';void this.load(1);}
 async exportRows(){
  if(this.exporting())return;this.exporting.set(true);this.error.set(null);
  const rows:AdmissionView[]=[];const filters={...this.applied,pageSize:100};let p=1;
  try{while(true){const x=await this.api.list({...filters,pageNumber:p});if(x.totalCount>10000)throw new Error('برای خروجی بیش از ۱۰٬۰۰۰ رکورد، فیلتر محدودتری انتخاب کنید.');rows.push(...x.data);if(!x.hasNextPage||p>=100)break;p++;}
   downloadCsv('hemo-admission.csv',[['نام','نام خانوادگی','شناسه','شماره پرونده','بخش','تخت','گروه خونی','وضعیت هویت','تاریخ پذیرش'],...rows.map(x=>[x.firstName,x.lastName,x.identificationNumber,x.hisNumber,x.ward,x.bedNumber,x.bloodGroup,label(x.identityStatus),isoToJalali(x.admittedAt)])]);
  }catch(e){this.error.set(message(e));}finally{this.exporting.set(false);}
 }
}
