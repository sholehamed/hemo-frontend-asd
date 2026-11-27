import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage,LabReportRow,LabHistoryFilters,CONCLUSIONS,LAB_RESULTS,SECOND_SAMPLE } from './bank-model';
import { bankDateTime,toUtc } from './bank-time';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-lab-history.component.html'})
export class BankLabHistoryComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);private route=inject(ActivatedRoute);
 requestGuid=this.route.snapshot.queryParamMap.get('request');readonly page=signal<BankPage<LabReportRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly conclusions=CONCLUSIONS;readonly options=Object.entries(CONCLUSIONS);readonly results=LAB_RESULTS;readonly samples=SECOND_SAMPLE;readonly fa=fa;readonly date=bankDateTime;readonly product=productLabel;
 search='';conclusion='';fromDate='';toDate='';private filters:LabHistoryFilters={};
 ngOnInit(){if(this.auth.bankCan('labHistory'))void this.load();}
 async load(pageNumber=1){if(!this.auth.bankCan('labHistory'))return;this.busy.set(true);this.error.set(null);try{if(pageNumber===1)this.filters={search:this.search,conclusion:this.conclusion,...(this.fromDate?{from:toUtc(this.fromDate,'00:00')}:{}),...(this.toDate?{to:toUtc(this.toDate,'23:59')}:{}),...(this.requestGuid?{requestGuid:this.requestGuid}:{})};this.page.set(await this.api.labHistory({...this.filters,pageNumber,pageSize:20}));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 clearRequest(){this.requestGuid=null;void this.load();}
 export(){const p=this.page();if(p)downloadCsv('hemo-bank-lab.csv',[['واحد','درخواست','مرجع گزارش','نمونه','روش','نتیجه','زمان','شرح'],...p.data.map(r=>[r.unitCode,r.requestNumber,r.test.reportReference,r.test.sampleReference,r.test.method,CONCLUSIONS[r.test.conclusion],bankDateTime(r.test.recordedAt),r.test.notes])]);}
 print(){window.print();}
}
