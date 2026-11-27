import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {QualityKind,QualityRow,KINDS,QUALITY_STATUS,key,statusColor} from './quality-model';
import {HEADERS} from './quality-fields';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./quality-list.component.html'})
export class QualityListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);private route=inject(ActivatedRoute);
 readonly kind=this.route.snapshot.data['kind'] as QualityKind;readonly title=KINDS[this.kind];readonly path=this.kind.toLowerCase();readonly fields=HEADERS[this.kind];readonly key=key;
 readonly page=signal<BankPage<QualityRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statuses=QUALITY_STATUS;readonly date=bankDateTime;readonly fa=fa;readonly color=statusColor;
 search='';ward='';status='';mine=false;fromDate='';toDate='';private filter:Record<string,unknown>={};

 canOpen(){return !!this.kind&&this.auth.qualityCan(key(this.kind,'List'));}
 async ngOnInit(){await this.auth.load();if(this.canOpen())await this.load();}
 ngOnDestroy(){this.scope.invalidate();this.page.set(null);}
 async load(pageNumber=1){
   if(!this.canOpen()||this.busy())return;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{if(pageNumber===1){const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString():undefined;
   if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه زمانی معتبر نیست.');
   this.filter={search:this.search,ward:this.ward,status:this.status,mine:this.mine,...(from?{from}:{}),...(to?{to}:{})};}
   const p=await this.api.list(this.kind,{...this.filter,pageNumber,pageSize:20});if(this.scope.isCurrent())this.page.set(p);}
   catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}
 }
 export(){const p=this.page();if(p&&this.canOpen()&&!this.busy())downloadCsv('hemo-'+this.path+'.csv',[['شماره','عنوان','بخش','زمان','وضعیت'],...p.data.map(r=>[r.number,r.title,r.ward,bankDateTime(r.occurredAt),QUALITY_STATUS[r.status]])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy())window.print();}
}
