import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {HvPageAccess} from './hv-page-access';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {message} from '../../shared/admission-utils';
import {bankDateTime} from '../blood-bank/bank-time';
import {CaseRow,Summary,STATUS,statusColor} from './hv-model';
import {HvMetricsComponent} from './hv-metrics.component';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,HemovigilanceService,HvPageAccess],imports:[RouterLink,MatButtonModule,RequestStateComponent,HvMetricsComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">HEMO / ST-06</p><h1>داشبورد هموویژیلانس</h1><p class="muted">پرونده واکنش، بررسی مسئول، تحلیل علت و پیگیری اثربخشی اقدامات.</p></section>
@if(auth.loading()){<app-request-state [loading]="true" [error]="null"/>}@else if(!auth.hvCan('stats')){<section class="panel"><h2>مجوز مشاهده آمار ندارید.</h2></section>}@else{
<div class="actions no-print">@if(auth.hvCan('list')){<a mat-stroked-button routerLink="/hemo/hv/cases">پرونده‌ها</a>}<button mat-stroked-button (click)="load()" [disabled]="busy()">به‌روزرسانی</button></div>
<app-request-state [loading]="busy()" [error]="error()"/>
@if(summary();as s){<app-hv-metrics [data]="s"/>}
@if(auth.hvCan('list')){<section class="panel"><div class="patient-title"><h2>پرونده‌های باز اخیر</h2><a mat-button routerLink="/hemo/hv/cases">همه پرونده‌ها</a></div><app-request-state [loading]="busy()" [error]="recentError()"/><div class="table-wrap"><table><thead><tr><th>پرونده</th><th>بیمار / بخش</th><th>بروز</th><th>وضعیت</th></tr></thead><tbody>@for(r of recent();track r.guid){<tr><td>{{r.caseNumber}}</td><td>{{r.patientName}} / {{r.ward}}</td><td>{{date(r.onsetAt)}}</td><td><span class="status-pill" [class]="color(r.status)">{{statuses[r.status]}}</span></td></tr>}@empty{@if(!busy()&&!recentError()){<tr><td colspan="4">پرونده باز وجود ندارد.</td></tr>}}</tbody></table></div></section>}}
} @else {<p role="alert">نقش یا نشست تغییر کرده است.</p>}
`})
export class HvDashboardComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(HvPageAccess);private api=inject(HemovigilanceService);readonly summary=signal<Summary|null>(null);readonly recent=signal<CaseRow[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly recentError=signal<string|null>(null);readonly statuses=STATUS;readonly color=statusColor;readonly date=bankDateTime;
 private seq=0;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;this.summary.set(null);this.recent.set([]);}
 async load(){
   if(!this.auth.hvCan('stats'))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.recentError.set(null);this.summary.set(null);this.recent.set([]);
   const tasks=[this.api.stats().then(s=>{if(this.current(seq))this.summary.set(s);}).catch(e=>{if(this.current(seq))this.error.set(message(e));})];
   if(this.auth.hvCan('list'))tasks.push(this.api.list({status:'Open',pageSize:8}).then(p=>{if(this.current(seq))this.recent.set(p.data);}).catch(e=>{if(this.current(seq))this.recentError.set(message(e));}));
   try{await Promise.all(tasks);}finally{if(this.current(seq))this.busy.set(false);}
 }
}
