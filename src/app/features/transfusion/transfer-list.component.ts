import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { TransferPageAccess } from './transfer-page-access';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage } from '../blood-bank/bank-model';
import { bankDateTime,toUtc } from '../blood-bank/bank-time';
import { TransferRow,TransferFilters,STATUSES,statusClass } from './transfer-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,TransfusionService,TransferPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-list.component.html'})
export class TransferListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(TransferPageAccess);private api=inject(TransfusionService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'tasks';
 readonly title=({tasks:'کارتابل تحویل و تزریق',vitals:'پایش علائم حیاتی',monitoring:'کارتابل پایش پزشک',returns:'مدیریت مرجوعی فرآورده',records:'پرونده و گزارش تزریق'} as Record<string,string>)[this.mode]??'حواله‌ها';
 readonly page=signal<BankPage<TransferRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statuses=STATUSES;readonly options=[['Active','در گردش'],['ReturnQueue','صف مرجوعی و توقف'],...Object.entries(STATUSES)];readonly color=statusClass;readonly fa=fa;readonly date=bankDateTime;readonly product=productLabel;
 search='';ward='';status=this.mode==='returns'?'ReturnQueue':this.mode==='vitals'||this.mode==='monitoring'?'Active':'';fromDate='';toDate='';
 admissionGuid=this.route.snapshot.queryParamMap.get('admission')??'';requestGuid=this.route.snapshot.queryParamMap.get('request')??'';private filters:TransferFilters={};private seq=0;
 private query?:Subscription;
 private fixedStatus(){return this.mode==='returns'?'ReturnQueue':this.mode==='vitals'||this.mode==='monitoring'?'Active':null;}
 canOpen(){return this.auth.transferCan('list')&&(this.mode==='vitals'?this.auth.transferCan('vital'):this.mode==='monitoring'?this.auth.transferCan('doctorNote'):this.mode==='returns'?(this.auth.transferCan('return')||this.auth.transferCan('acceptReturn')||this.auth.transferCan('dispose')):true);}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){
   await this.auth.load();if(!this.canOpen())return;
   this.query=this.route.queryParamMap.subscribe(q=>{
     this.search=this.ward=this.fromDate=this.toDate='';this.admissionGuid=q.get('admission')??'';this.requestGuid=q.get('request')??'';
     const status=q.get('status')??'';this.status=this.fixedStatus()??(this.options.some(([value])=>value===status)?status:'');void this.load();
   });
 }
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.search=this.ward=this.admissionGuid=this.requestGuid='';}
 async load(pageNumber=1){
   if(!this.canOpen())return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{
     if(pageNumber===1){
       const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString():undefined;
       if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه تاریخ معتبر نیست.');
       this.filters={search:this.search,ward:this.ward,status:this.fixedStatus()??this.status,admissionGuid:this.admissionGuid||undefined,requestGuid:this.requestGuid||undefined,...(from?{from}:{}),...(to?{to}:{})};
     }
     const p=await this.api.list({...this.filters,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 reset(){if(!this.canOpen())return;this.search=this.ward=this.fromDate=this.toDate=this.admissionGuid=this.requestGuid='';this.status=this.fixedStatus()??'';void this.load();}
 export(){const p=this.page();if(p&&this.canOpen()&&!this.busy())downloadCsv('hemo-transfusion.csv',[['حواله','بیمار','پرونده','بخش','واحد','فرآورده','وضعیت','زمان ارسال'],...p.data.map(t=>[t.transferNumber,t.patientName,t.hisNumber,t.ward,t.unitCode,productLabel(t.productCode),STATUSES[t.status],bankDateTime(t.dispatchedAt)])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy())window.print();}
}
