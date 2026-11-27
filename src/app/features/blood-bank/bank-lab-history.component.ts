import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage,LabReportRow,LabHistoryFilters,CONCLUSIONS,LAB_RESULTS,SECOND_SAMPLE } from './bank-model';
import { bankDateTime,toUtc } from './bank-time';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BankPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-lab-history.component.html'})
export class BankLabHistoryComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);private api=inject(BloodBankService);private route=inject(ActivatedRoute);
 requestGuid=this.route.snapshot.queryParamMap.get('request');readonly page=signal<BankPage<LabReportRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly conclusions=CONCLUSIONS;readonly options=Object.entries(CONCLUSIONS);readonly results=LAB_RESULTS;readonly samples=SECOND_SAMPLE;readonly fa=fa;readonly date=bankDateTime;readonly product=productLabel;
 search='';conclusion='';fromDate='';toDate='';private filters:LabHistoryFilters={};
 private seq=0;private query?:Subscription;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){
   await this.auth.load();if(!this.auth.bankCan('labHistory'))return;
   this.query=this.route.queryParamMap.subscribe(q=>{this.requestGuid=q.get('request');this.search=this.conclusion=this.fromDate=this.toDate='';void this.load();});
 }
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.requestGuid=null;this.search='';}
 async load(pageNumber=1){
   if(!this.auth.bankCan('labHistory'))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{
     if(pageNumber===1){
       const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?toUtc(this.toDate,'23:59'):undefined;
       if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه تاریخ معتبر نیست.');
       this.filters={search:this.search,conclusion:this.conclusion,...(from?{from}:{}),...(to?{to}:{}),...(this.requestGuid?{requestGuid:this.requestGuid}:{})};
     }
     const p=await this.api.labHistory({...this.filters,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 export(){const p=this.page();if(p&&this.auth.bankCan('labHistory')&&!this.busy())downloadCsv('hemo-bank-lab.csv',[['واحد','درخواست','مرجع گزارش','نمونه','روش','نتیجه','زمان','شرح'],...p.data.map(r=>[r.unitCode,r.requestNumber,r.test.reportReference,r.test.sampleReference,r.test.method,CONCLUSIONS[r.test.conclusion],bankDateTime(r.test.recordedAt),r.test.notes])]);}
 print(){if(this.auth.bankCan('labHistory')&&this.page()&&!this.busy())window.print();}
}
