import { Component,OnInit,OnDestroy,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { RequestPageAccess } from './request-page-access';
import { Subscription } from 'rxjs';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { downloadCsv,fa,message } from '../../shared/admission-utils';
import { isoToJalali,normalizeDigits } from '../../shared/jalali-date';
import { RequestPage,RequestStats,RequestFilters,REQUEST_STATUS_LABEL,PRIORITIES,formLabel } from './blood-request-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodRequestsService,RequestPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./request-list.component.html'})
export class RequestListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(RequestPageAccess);private api=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'list';readonly bank=this.mode==='bank';readonly approval=this.mode==='approval';
 readonly title=this.bank?'صف درخواست‌های تأییدشده بانک خون':this.approval?'کارتابل تأیید پزشک':'مدیریت درخواست‌های خون و فرآورده‌ها';
 readonly canList=computed(()=>this.bank?this.auth.requestCan('bankQueue'):this.auth.requestCan('list')&&(!this.approval||this.auth.requestCan('decide')));
 readonly canStats=computed(()=>!this.bank&&!this.approval&&this.auth.requestCan('stats'));
 readonly allowed=computed(()=>this.canList()||this.canStats());
 readonly statsError=signal<string|null>(null);readonly page=signal<RequestPage|null>(null);readonly stats=signal<RequestStats|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statusLabels=REQUEST_STATUS_LABEL;readonly priorities=PRIORITIES;readonly formLabel=formLabel;readonly date=isoToJalali;readonly fa=fa;
 readonly statuses=Object.entries(REQUEST_STATUS_LABEL);readonly priorityList=Object.entries(PRIORITIES);
 search='';status='';priority='';ward='';mine=false;readonly patientFilter=signal<string|null>(null);
 private applied:RequestFilters={};private seq=0;private query?:Subscription;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){
   await this.auth.load();
   if(!this.scope.isCurrent())return;
   this.query=this.route.queryParamMap.subscribe(q=>{
     const status=q.get('status')??'';
     this.status=Object.keys(REQUEST_STATUS_LABEL).includes(status)?status:'';
     this.mine=q.get('mine')==='true';
     this.patientFilter.set(this.bank?null:q.get('admission'));
     this.search=this.priority=this.ward='';
     this.page.set(null);this.stats.set(null);
     void this.load(1);
   });
 }
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.stats.set(null);this.search=this.ward='';this.patientFilter.set(null);}
 async load(pageNumber=1){
   if(!this.allowed()||!this.scope.isCurrent())return;
   const patient=this.patientFilter();
   if(pageNumber===1)this.applied={search:normalizeDigits(this.search.trim()),status:this.approval?'AwaitingDoctor':this.status,priority:this.priority,ward:this.ward,mine:this.mine,...(!this.bank&&patient?{patientAdmissionGuid:patient}:{})};
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.statsError.set(null);this.page.set(null);this.stats.set(null);
   try{
     const filters={...this.applied,pageNumber,pageSize:20};
     const tasks:Promise<void>[]=[];
     if(this.canList())tasks.push((this.bank?this.api.bank(filters):this.api.list(filters)).then(page=>{if(this.current(seq))this.page.set(page);}).catch(e=>{if(this.current(seq))this.error.set(message(e));}));
     // The stats contract has only mine; do not present global metrics as patient-filtered metrics.
     if(this.canStats()&&!patient)tasks.push(this.api.stats(this.mine).then(stats=>{if(this.current(seq))this.stats.set(stats);}).catch(e=>{if(this.current(seq))this.statsError.set(message(e));}));
     await Promise.all(tasks);
   }finally{if(this.current(seq))this.busy.set(false);}
 }
 reset(){this.search=this.status=this.priority=this.ward='';this.mine=false;void this.load();}
 exportPage(){const p=this.page();if(!this.canList()||!p||this.busy())return;downloadCsv('hemo-blood-requests-page.csv',[['درخواست','بیمار','پرونده','بخش','فرم','اولویت','وضعیت','تعداد','تاریخ'],...p.data.map(r=>[r.requestNumber,r.patientName,r.hisNumber,r.ward,formLabel(r.formType),PRIORITIES[r.priority],REQUEST_STATUS_LABEL[r.status],r.totalUnits,isoToJalali(r.created)])]);}
 print(){if(this.canList()&&this.page()&&!this.busy())window.print();}
}
