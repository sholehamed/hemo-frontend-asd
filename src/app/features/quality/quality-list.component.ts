import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,localFields,toUtc} from '../blood-bank/bank-time';
import {QualityKind,QualityRow,KINDS,QUALITY_STATUS,key,statusColor} from './quality-model';
import {HEADERS,blank,payload} from './quality-fields';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./quality-list.component.html'})
export class QualityListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);private route=inject(ActivatedRoute);private router=inject(Router);
 readonly kind=this.route.snapshot.data['kind'] as QualityKind;readonly title=KINDS[this.kind];readonly path=this.kind.toLowerCase();readonly fields=HEADERS[this.kind];readonly key=key;
 readonly page=signal<BankPage<QualityRow>|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly creating=signal(false);readonly savedGuid=signal<string|null>(null);readonly error=signal<string|null>(null);
 readonly statuses=QUALITY_STATUS;readonly date=bankDateTime;readonly fa=fa;readonly color=statusColor;
 search='';ward='';status='';mine=false;fromDate='';toDate='';private filter:Record<string,unknown>={};

 form={title:'',ward:'',...localFields()};header=blank(this.fields);
 canCreate(){return this.canOpen()&&this.auth.qualityCan(key(this.kind,'Create'))&&this.auth.qualityCan(key(this.kind,'Detail'));}
 openCreate(){if(!this.canCreate()||this.busy()||this.saving()||this.savedGuid())return;this.form={title:'',ward:'',...localFields()};this.header=blank(this.fields);this.creating.set(true);this.error.set(null);}
 cancelCreate(){if(this.saving())return;this.creating.set(false);this.form={title:'',ward:'',...localFields()};this.header=blank(this.fields);}
 newRecord(){if(!this.canCreate()||this.saving())return;this.savedGuid.set(null);this.cancelCreate();}
 async save(){
   if(!this.canCreate()||!this.creating()||this.busy()||this.saving()||this.savedGuid())return;
   this.error.set(null);try{if(!this.form.title.trim()||!this.form.ward.trim())throw new Error('عنوان و بخش لازم است.');
     const input={title:this.form.title.trim(),ward:this.form.ward.trim(),occurredAt:toUtc(this.form.date,this.form.time),header:payload(this.fields,this.header)};
     if(!window.confirm('پیش‌نویس پرونده ایجاد شود؟'))return;this.saving.set(true);const id=await this.api.create(this.kind,input);
     if(!this.scope.isCurrent())return;this.savedGuid.set(id);this.creating.set(false);this.form={title:'',ward:'',...localFields()};this.header=blank(this.fields);this.page.set(null);await this.router.navigate(['/hemo/quality',this.path,id]);
   }catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.saving.set(false);}
 }
 canOpen(){return !!this.kind&&this.auth.qualityCan(key(this.kind,'List'));}
 async ngOnInit(){await this.auth.load();if(this.canOpen())await this.load();}
 ngOnDestroy(){this.scope.invalidate();this.page.set(null);this.savedGuid.set(null);this.saving.set(false);this.cancelCreate();}
 async load(pageNumber=1){
   if(!this.canOpen()||this.busy()||this.saving())return;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{if(pageNumber===1){const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString():undefined;
   if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه زمانی معتبر نیست.');
   this.filter={search:this.search,ward:this.ward,status:this.status,mine:this.mine,...(from?{from}:{}),...(to?{to}:{})};}
   const p=await this.api.list(this.kind,{...this.filter,pageNumber,pageSize:20});if(this.scope.isCurrent())this.page.set(p);}
   catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}
 }
 export(){const p=this.page();if(p&&this.canOpen()&&!this.busy()&&!this.saving())downloadCsv('hemo-'+this.path+'.csv',[['شماره','عنوان','بخش','زمان','وضعیت'],...p.data.map(r=>[r.number,r.title,r.ward,bankDateTime(r.occurredAt),QUALITY_STATUS[r.status]])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy()&&!this.saving())window.print();}
}
