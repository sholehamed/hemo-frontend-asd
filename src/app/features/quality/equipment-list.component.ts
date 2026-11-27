import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime} from '../blood-bank/bank-time';
import {EquipmentRow,CATEGORIES,EQUIPMENT_STATUS,equipmentDue,statusColor} from './quality-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./equipment-list.component.html'})
export class EquipmentListComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'equipment';readonly title=this.mode==='maintenance'?'کارتابل سرویس و کالیبراسیون':this.mode==='temperature'?'پایش دمای تجهیزات':'شناسنامه و پلاک اموال تجهیزات';
 readonly page=signal<BankPage<EquipmentRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly cats=Object.entries(CATEGORIES);readonly statuses=Object.entries(EQUIPMENT_STATUS);readonly category=CATEGORIES;readonly status=EQUIPMENT_STATUS;readonly due=equipmentDue;readonly color=statusColor;readonly date=bankDateTime;readonly fa=fa;
 search=this.route.snapshot.queryParamMap.get('search')??'';categoryFilter='';ward='';statusFilter=this.mode==='maintenance'?'Due':'';private filter:Record<string,unknown>={};

 private seq=0;private query?:Subscription;
 canOpen(){return this.auth.qualityCan('equipmentList')&&(this.mode==='maintenance'?this.auth.qualityCan('equipmentService'):this.mode==='temperature'?this.auth.qualityCan('equipmentTemperature'):true);}
 async ngOnInit(){await this.auth.load();if(!this.canOpen())return;this.query=this.route.queryParamMap.subscribe(q=>{this.search=q.get('search')??'';this.categoryFilter=this.ward='';const status=q.get('status')??'';this.statusFilter=this.mode==='maintenance'?'Due':Object.keys(EQUIPMENT_STATUS).includes(status)?status:'';void this.load();});}
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);}
 async load(pageNumber=1){
   if(!this.canOpen())return;const seq=++this.seq,current=()=>this.scope.isCurrent()&&seq===this.seq;
   this.busy.set(true);this.error.set(null);this.page.set(null);
   try{if(pageNumber===1)this.filter={search:this.search,category:this.categoryFilter,ward:this.ward,status:this.mode==='maintenance'?'Due':this.statusFilter};const p=await this.api.equipmentList({...this.filter,pageNumber,pageSize:20});if(current())this.page.set(p);}
   catch(e){if(current())this.error.set(message(e));}finally{if(current())this.busy.set(false);}
 }
 export(){const p=this.page();if(p&&this.canOpen()&&!this.busy())downloadCsv('hemo-equipment.csv',[['کد','نام','دسته','مدل','محل','وضعیت','سررسید کالیبراسیون','سررسید سرویس'],...p.data.map(x=>[x.code,x.name,CATEGORIES[x.category],x.brandModel,x.ward,EQUIPMENT_STATUS[x.status],bankDateTime(x.calibrationDueAt),bankDateTime(x.maintenanceDueAt)])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy())window.print();}
}
