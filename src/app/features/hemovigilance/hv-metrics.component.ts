import {Component,input} from '@angular/core';
import {fa} from '../../shared/admission-utils';
import {productLabel} from '../blood-requests/blood-request-model';
import {Summary,Count,DIAGNOSES,SEVERITIES,STATUS} from './hv-model';
@Component({selector:'app-hv-metrics',standalone:true,template:`
<div class="metric-grid">@for(m of metrics(data());track m.label){<div class="metric"><span>{{m.label}}</span><strong>{{fa(m.value)}}</strong></div>}</div>
<div class="notice info">شمارش پرونده‌ها بر اساس زمان بروز و شمارش تزریق‌ها بر اساس زمان شروع است؛ این دو الزاماً یک کوهورت نیستند و نرخ بروز محاسبه نمی‌شود.</div>
<div class="area-grid">@for(g of groups(data());track g.title){<section class="panel hv-chart"><h2>{{g.title}}</h2>@for(row of g.rows;track row.key){<div class="hv-bar-label"><span>{{name(g.title,row.key)}}</span><strong>{{fa(row.count)}}</strong></div><div class="hv-bar"><span [style.width.%]="width(row,g.rows)"></span></div>}@empty{<p class="muted">داده‌ای ثبت نشده است.</p>}</section>}</div>
`,styles:[`.hv-chart{margin:0}.hv-bar-label{display:flex;justify-content:space-between;gap:12px;margin-top:8px;font-size:13px}.hv-bar{height:9px;background:#f0e4e7;border-radius:6px;overflow:hidden}.hv-bar span{display:block;height:100%;background:#c8102e;border-radius:6px}.area-grid{align-items:stretch}`]})
export class HvMetricsComponent{
 readonly data=input.required<Summary>();readonly fa=fa;
 metrics(s:Summary){return [{label:'کل پرونده‌ها',value:s.total},{label:'باز',value:s.open},{label:'بسته',value:s.closed},{label:'بررسی پزشک',value:s.pendingDoctor},{label:'بررسی بانک',value:s.pendingBank},{label:'RCA باز',value:s.rcaOpen},{label:'پیگیری CAPA',value:s.capaMonitoring},{label:'اقدام تأییدنشده',value:s.capaOpen},{label:'اقدام سررسید گذشته',value:s.capaOverdue},{label:'گزارش بیرونی موردنیاز',value:s.externalPending},{label:'تزریق شروع‌شده',value:s.startedTransfers}];}
 groups(s:Summary){return [{title:'تشخیص ثبت‌شده',rows:s.byDiagnosis},{title:'شدت ثبت‌شده',rows:s.bySeverity},{title:'بخش',rows:s.byWard},{title:'فرآورده',rows:s.byProduct},{title:'وضعیت',rows:s.byStatus}];}
 name(title:string,key:string){return title==='تشخیص ثبت‌شده'?DIAGNOSES[key]??key:title==='شدت ثبت‌شده'?SEVERITIES[key]??key:title==='فرآورده'?productLabel(key):title==='وضعیت'?(STATUS as Record<string,string>)[key]??key:key;}
 width(row:Count,rows:Count[]){return row.count/Math.max(1,...rows.map(x=>x.count))*100;}
}
