import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {HvPageAccess} from './hv-page-access';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {CaseRow,Filters,STATUS,DIAGNOSES,SEVERITIES,statusColor} from './hv-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,HemovigilanceService,HvPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./hv-list.component.html'})
export class HvListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(HvPageAccess);private api=inject(HemovigilanceService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'cases';readonly title=({cases:'پرونده واکنش‌های نامطلوب',doctor:'کارتابل بررسی پزشک',bank:'کارتابل بررسی بانک خون',rca:'کارتابل تحلیل ریشه‌ای RCA',capa:'کارتابل پیگیری CAPA'} as Record<string,string>)[this.mode];
 readonly page=signal<BankPage<CaseRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statuses=STATUS;readonly statusOptions=[['Open','پرونده‌های باز'],['RcaQueue','تصمیم RCA / تحلیل باز'],...Object.entries(STATUS)];readonly diagnosis=DIAGNOSES;readonly severity=SEVERITIES;readonly severityOptions=Object.entries(SEVERITIES);readonly date=bankDateTime;readonly fa=fa;readonly product=productLabel;readonly color=statusColor;
 search='';ward='';productCode='';severityFilter='';fromDate='';toDate='';status=({doctor:'Reported',bank:'DoctorReviewed',rca:'RcaQueue',capa:'CapaMonitoring'} as Record<string,string>)[this.mode]??'';
 mineCapa=false;
 transferGuid=this.route.snapshot.queryParamMap.get('transfer')??'';private filters:Filters={};private seq=0;
 private query?:Subscription;
 private fixedStatus(){return ({doctor:'Reported',bank:'DoctorReviewed',rca:'RcaQueue',capa:'CapaMonitoring'} as Record<string,string>)[this.mode]??null;}
 ownerOnly(){return this.mode==='capa'&&this.auth.hvCan('capaProgress')&&!this.auth.hvCan('capaVerify')&&!this.auth.hvCan('assignCapa');}
 canOpen(){return this.auth.hvCan('list')&&(this.mode==='doctor'?this.auth.hvCan('doctorReview'):this.mode==='bank'?this.auth.hvCan('bankReview'):this.mode==='rca'?(this.auth.hvCan('investigate')||this.auth.hvCan('publishRca')):this.mode==='capa'?(this.auth.hvCan('assignCapa')||this.auth.hvCan('capaProgress')||this.auth.hvCan('capaVerify')||this.auth.hvCan('close')):true);}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){
   await this.auth.load();if(!this.canOpen())return;
   this.query=this.route.queryParamMap.subscribe(q=>{
     this.search=this.ward=this.productCode=this.severityFilter=this.fromDate=this.toDate='';this.mineCapa=this.ownerOnly();this.transferGuid=q.get('transfer')??'';
     const status=q.get('status')??'';this.status=this.fixedStatus()??(this.statusOptions.some(([value])=>value===status)?status:'');void this.load();
   });
 }
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.search=this.transferGuid='';}
 async load(pageNumber=1){
   if(!this.canOpen())return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{
     if(pageNumber===1){
       const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString():undefined;
       if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه تاریخ معتبر نیست.');
       this.filters={search:this.search,status:this.fixedStatus()??this.status,ward:this.ward,productCode:this.productCode,severity:this.severityFilter,mineCapa:this.ownerOnly()||(this.auth.hvCan('capaProgress')&&this.mineCapa),transferGuid:this.transferGuid||undefined,...(from?{from}:{}),...(to?{to}:{})};
     }
     const p=await this.api.list({...this.filters,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 reset(){if(!this.canOpen())return;this.mineCapa=this.ownerOnly();this.search=this.ward=this.productCode=this.severityFilter=this.fromDate=this.toDate=this.transferGuid='';this.status=this.fixedStatus()??'';void this.load();}
 export(){const p=this.page();if(p&&this.canOpen()&&!this.busy())downloadCsv('hemo-hv-cases.csv',[['پرونده واکنش','بیمار','پرونده بیمار','بخش','فرآورده','کیسه','بروز','تشخیص ثبت‌شده','شدت ثبت‌شده','وضعیت'],...p.data.map(r=>[r.caseNumber,r.patientName,r.hisNumber,r.ward,productLabel(r.productCode),r.unitCode,bankDateTime(r.onsetAt),DIAGNOSES[r.diagnosisCode??'Undetermined'],SEVERITIES[r.severity??r.initialSeverity],STATUS[r.status]])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy())window.print();}
}
