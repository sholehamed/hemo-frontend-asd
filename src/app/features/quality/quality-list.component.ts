import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,localFields,toUtc} from '../blood-bank/bank-time';
import {QualityKind,QualityRow,KINDS,QUALITY_STATUS,key,statusColor} from './quality-model';
import {HEADERS,blank,payload} from './quality-fields';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./quality-list.component.html'})
export class QualityListComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);private route=inject(ActivatedRoute);private router=inject(Router);
 readonly kind=this.route.snapshot.data['kind'] as QualityKind;readonly title=KINDS[this.kind];readonly path=this.kind.toLowerCase();readonly fields=HEADERS[this.kind];readonly key=key;
 readonly page=signal<BankPage<QualityRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly creating=signal(false);
 readonly statuses=QUALITY_STATUS;readonly date=bankDateTime;readonly fa=fa;readonly color=statusColor;
 search='';ward='';status='';mine=false;fromDate='';toDate='';private filter:Record<string,unknown>={};
 form={title:'',ward:'',...localFields()};header=blank(this.fields);
 ngOnInit(){if(this.auth.qualityCan(key(this.kind,'List')))void this.load();}
 async load(pageNumber=1){if(!this.auth.qualityCan(key(this.kind,'List'))||this.busy())return;this.busy.set(true);this.error.set(null);try{if(pageNumber===1)this.filter={search:this.search,ward:this.ward,status:this.status,mine:this.mine,...(this.fromDate?{from:toUtc(this.fromDate,'00:00')}:{}),...(this.toDate?{to:new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString()}: {})};this.page.set(await this.api.list(this.kind,{...this.filter,pageNumber,pageSize:20}));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async save(){if(this.busy()||!this.auth.qualityCan(key(this.kind,'Create')))return;this.busy.set(true);this.error.set(null);try{const id=await this.api.create(this.kind,{title:this.form.title,ward:this.form.ward,occurredAt:toUtc(this.form.date,this.form.time),header:payload(this.fields,this.header)});await this.router.navigate(['/hemo/quality',this.path,id]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 export(){const p=this.page();if(p)downloadCsv('hemo-'+this.path+'.csv',[['شماره','عنوان','بخش','زمان','وضعیت'],...p.data.map(r=>[r.number,r.title,r.ward,bankDateTime(r.occurredAt),QUALITY_STATUS[r.status]])]);}
 print(){window.print();}
}
