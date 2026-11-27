import { Component,OnInit,inject,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { message,fa } from '../../shared/admission-utils';
@Component({standalone:true,imports:[RouterLink,MatButtonModule,RequestStateComponent],template:`
<section class="heading"><p class="eyebrow">پذیرش / ارتباط با سامانه‌ها</p><h1>مرکز همگام‌سازی سرویس‌ها (Integration Engine)</h1><p class="muted">پایش آمادگی اتصال سرویس‌های بیرونی و پرونده‌های موجود</p></section>
<div class="notice warn"><strong>اتصال سرویس بیرونی تعریف نشده است</strong>قرارداد و آدرس سرویس HIS، ثبت احوال و IBTO در این مرحله در اختیار پروژه قرار نگرفته است. تا زمان تعریف اتصال، هیچ پیام موفقیت ساختگی یا ارسال واقعی نمایش داده نمی‌شود.</div>
<div class="metric-grid">@for(x of ['HIS / پذیرش','ثبت احوال / هویت','IBTO / سوابق خون'];track x){<div class="metric warn"><strong style="font-size:18px">{{x}}</strong><span class="status-pill Pending">پیکربندی نشده</span></div>}</div>
<section class="panel"><div class="patient-title"><h2>پرونده‌های اخیر ثبت‌شده در HEMO</h2><button mat-stroked-button (click)="load()" [disabled]="busy()">به‌روزرسانی فهرست</button></div><p class="muted">این جدول صف ارسال HIS نیست؛ فقط پرونده‌های داخلی قابل بازیابی را نمایش می‌دهد.</p>
<app-request-state [loading]="busy()" [error]="error()"/><div class="table-wrap"><table><thead><tr><th>شناسه پرونده</th><th>بیمار</th><th>بخش</th><th>وضعیت اتصال بیرونی</th></tr></thead><tbody>@for(p of rows();track p.guid){<tr><td><a [routerLink]="['/admission/detail',p.guid]">{{p.hisNumber}}</a></td><td>{{p.firstName}} {{p.lastName}}</td><td>{{p.ward}}</td><td><span class="status-pill Pending">ارسال ارزیابی نشده</span></td></tr>}@empty{<tr><td colspan="4">پرونده‌ای موجود نیست.</td></tr>}</tbody></table></div>
<div class="actions"><button mat-flat-button disabled>اجرای همگام‌سازی</button><button mat-stroked-button disabled>تست اتصال HIS</button><button mat-stroked-button disabled>ارسال مجدد</button></div></section>
<section class="panel"><h2>کنسول پیام‌های تبادل</h2><p class="muted">هنوز Connector پیکربندی نشده و لاگ تبادل واقعی وجود ندارد.</p></section>
`})
export class AdmissionHisComponent implements OnInit{
 private api=inject(AdmissionsService);readonly rows=signal<AdmissionView[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;
 ngOnInit(){void this.load();}
 async load(){this.busy.set(true);this.error.set(null);try{this.rows.set((await this.api.list({pageNumber:1,pageSize:20})).data);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
