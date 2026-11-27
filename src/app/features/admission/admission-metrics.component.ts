import { Component,input } from '@angular/core';
import { AdmissionStats } from '../../core/api/admissions.service';
import { fa,percentage } from '../../shared/admission-utils';
@Component({selector:'app-admission-metrics',standalone:true,template:`
@if(stats();as x){<div class="metric-grid">
<div class="metric"><span>کل پذیرش‌ها</span><strong>{{fa(x.total)}}</strong><small>مرکز جاری</small></div>
<div class="metric"><span>بستری فعال</span><strong>{{fa(x.active)}}</strong><small>پرونده باز</small></div>
<div class="metric good"><span>هویت تأیید شده</span><strong>{{fa(x.verified)}}</strong><small>{{fa(percentage(x.verified,x.total))}}٪ پوشش</small></div>
<div class="metric danger"><span>عدم انطباق هویت</span><strong>{{fa(x.mismatch)}}</strong><small>نیازمند پیگیری</small></div>
<div class="metric warn"><span>آماده بررسی ترخیص</span><strong>{{fa(x.ready)}}</strong><small>نتیجه کنترل مدارک</small></div>
</div>}`})
export class AdmissionMetricsComponent{readonly stats=input.required<AdmissionStats|null>();readonly fa=fa;readonly percentage=percentage;}
