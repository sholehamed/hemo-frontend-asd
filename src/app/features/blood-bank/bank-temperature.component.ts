import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BankPage,TemperatureView,TemperatureFilters,ASSESSMENTS } from './bank-model';
import { bankDateTime,localFields,toUtc } from './bank-time';
import { message,fa,downloadCsv } from '../../shared/admission-utils';
@Component({standalone:true,imports:[FormsModule,MatButtonModule,RequestStateComponent],templateUrl:'./bank-temperature.component.html'})
export class BankTemperatureComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);readonly page=signal<BankPage<TemperatureView>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly assessments=Object.entries(ASSESSMENTS);readonly labels=ASSESSMENTS;readonly date=bankDateTime;readonly fa=fa;
 form={equipmentCode:'',temperature:null as number|null,assessment:'',notes:''};measured=localFields();equipment='';assessment='';fromDate='';toDate='';private filters:TemperatureFilters={};
 ngOnInit(){if(this.auth.bankCan('temperatureHistory'))void this.load();}
 async load(pageNumber=1){if(!this.auth.bankCan('temperatureHistory'))return;this.busy.set(true);this.error.set(null);try{if(pageNumber===1)this.filters={equipment:this.equipment,assessment:this.assessment,...(this.fromDate?{from:toUtc(this.fromDate,'00:00')}:{}),...(this.toDate?{to:toUtc(this.toDate,'23:59')}: {})};this.page.set(await this.api.temperatures({...this.filters,pageNumber,pageSize:20}));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async save(){if(!this.auth.bankCan('temperature')||this.busy())return;this.error.set(null);this.success.set(null);this.busy.set(true);try{const f=this.form;if(!f.equipmentCode.trim()||f.temperature===null||!Number.isFinite(f.temperature)||!f.assessment||f.assessment!=='Acceptable'&&!f.notes.trim())throw new Error('اطلاعات اندازه‌گیری و ارزیابی مستند را تکمیل کنید.');if(f.assessment!=='Acceptable'&&!window.confirm('ثبت نگرانی یا وضعیت نامشخص باعث توقف واحدهای این تجهیز می‌شود. ادامه؟'))return;await this.api.temperature({...f,temperature:f.temperature,measuredAt:toUtc(this.measured.date,this.measured.time),notes:f.notes||null});this.success.set('اندازه‌گیری ثبت شد.');this.form={equipmentCode:f.equipmentCode,temperature:null,assessment:'',notes:''};this.measured=localFields();await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 export(){const p=this.page();if(p)downloadCsv('hemo-bank-temperature.csv',[['تجهیز','دما','زمان','ارزیابی','توضیحات'],...p.data.map(t=>[t.equipmentCode,t.temperature,bankDateTime(t.measuredAt),ASSESSMENTS[t.assessment],t.notes])]);}
 print(){window.print();}
}
