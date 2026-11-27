import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime} from '../blood-bank/bank-time';
import {EquipmentRow,CATEGORIES,EQUIPMENT_STATUS,equipmentDue,statusColor} from './quality-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./equipment-list.component.html'})
export class EquipmentListComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);private route=inject(ActivatedRoute);private router=inject(Router);
 readonly mode=this.route.snapshot.data['mode']??'equipment';readonly title=this.mode==='maintenance'?'کارتابل سرویس و کالیبراسیون':this.mode==='temperature'?'پایش دمای تجهیزات':'شناسنامه و پلاک اموال تجهیزات';
 readonly page=signal<BankPage<EquipmentRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly creating=signal(false);
 readonly cats=Object.entries(CATEGORIES);readonly statuses=Object.entries(EQUIPMENT_STATUS);readonly category=CATEGORIES;readonly status=EQUIPMENT_STATUS;readonly due=equipmentDue;readonly color=statusColor;readonly date=bankDateTime;readonly fa=fa;
 search=this.route.snapshot.queryParamMap.get('search')??'';categoryFilter='';ward='';statusFilter=this.mode==='maintenance'?'Due':'';private filter:Record<string,unknown>={};
 form={code:this.search,name:'',category:'',brandModel:'',ward:'',serialNumber:''};
 ngOnInit(){const status=this.route.snapshot.queryParamMap.get('status')??'';if(Object.keys(EQUIPMENT_STATUS).includes(status))this.statusFilter=status;if(this.auth.qualityCan('equipmentList'))void this.load();}
 async load(pageNumber=1){if(!this.auth.qualityCan('equipmentList')||this.busy())return;this.busy.set(true);this.error.set(null);try{if(pageNumber===1)this.filter={search:this.search,category:this.categoryFilter,ward:this.ward,status:this.statusFilter};this.page.set(await this.api.equipmentList({...this.filter,pageNumber,pageSize:20}));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async save(){if(!this.auth.qualityCan('equipmentCreate')||this.busy())return;this.busy.set(true);this.error.set(null);try{const id=await this.api.equipmentCreate(this.form);await this.router.navigate(['/hemo/quality/equipment',id]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 export(){const p=this.page();if(p)downloadCsv('hemo-equipment.csv',[['کد','نام','دسته','مدل','محل','وضعیت','سررسید کالیبراسیون','سررسید سرویس'],...p.data.map(x=>[x.code,x.name,CATEGORIES[x.category],x.brandModel,x.ward,EQUIPMENT_STATUS[x.status],bankDateTime(x.calibrationDueAt),bankDateTime(x.maintenanceDueAt)])]);}
 print(){window.print();}
}
