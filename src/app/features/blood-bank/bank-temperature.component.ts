import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BankPage,TemperatureView,TemperatureFilters,ASSESSMENTS } from './bank-model';
import { bankDateTime,localFields,toUtc } from './bank-time';
import { message,fa,downloadCsv } from '../../shared/admission-utils';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BankPageAccess],imports:[FormsModule,MatButtonModule,RequestStateComponent],templateUrl:'./bank-temperature.component.html'})
export class BankTemperatureComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);private api=inject(BloodBankService);readonly page=signal<BankPage<TemperatureView>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly assessments=Object.entries(ASSESSMENTS);readonly labels=ASSESSMENTS;readonly date=bankDateTime;readonly fa=fa;
 form={equipmentCode:'',temperature:null as number|null,assessment:'',notes:''};measured=localFields();equipment='';assessment='';fromDate='';toDate='';private filters:TemperatureFilters={};
 private seq=0;readonly saving=signal(false);
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;this.page.set(null);this.form={equipmentCode:'',temperature:null,assessment:'',notes:''};this.success.set(null);}
 async load(pageNumber=1){
   if(!this.auth.bankCan('temperatureHistory')||this.saving())return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{
     if(pageNumber===1){
       const from=this.fromDate?toUtc(this.fromDate,'00:00'):undefined,to=this.toDate?toUtc(this.toDate,'23:59'):undefined;
       if(from&&to&&Date.parse(from)>Date.parse(to))throw new Error('بازه تاریخ معتبر نیست.');
       this.filters={equipment:this.equipment,assessment:this.assessment,...(from?{from}:{}),...(to?{to}:{})};
     }
     const p=await this.api.temperatures({...this.filters,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async save(){
   if(!this.auth.bankCan('temperature')||this.busy()||this.saving())return;
   const seq=++this.seq;this.error.set(null);this.success.set(null);this.saving.set(true);
   try{
     const f=this.form;
     if(!f.equipmentCode.trim()||f.temperature===null||!Number.isFinite(f.temperature)||!Object.prototype.hasOwnProperty.call(ASSESSMENTS,f.assessment)||(f.assessment!=='Acceptable'&&!f.notes.trim()))throw new Error('اطلاعات اندازه‌گیری و ارزیابی مستند را تکمیل کنید.');
     if(f.assessment!=='Acceptable'&&!window.confirm('ثبت نگرانی یا وضعیت نامشخص باعث توقف واحدهای این تجهیز می‌شود. ادامه؟'))return;
     await this.api.temperature({...f,temperature:f.temperature,measuredAt:toUtc(this.measured.date,this.measured.time),notes:f.notes||null});
     if(!this.current(seq))return;
     this.success.set('اندازه‌گیری ثبت شد.');this.form={equipmentCode:f.equipmentCode,temperature:null,assessment:'',notes:''};this.measured=localFields();
     this.saving.set(false);await this.load();
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
 export(){const p=this.page();if(p&&this.auth.bankCan('temperatureHistory')&&!this.busy()&&!this.saving())downloadCsv('hemo-bank-temperature.csv',[['تجهیز','دما','زمان','ارزیابی','توضیحات'],...p.data.map(t=>[t.equipmentCode,t.temperature,bankDateTime(t.measuredAt),ASSESSMENTS[t.assessment],t.notes])]);}
 print(){if(this.auth.bankCan('temperatureHistory')&&this.page()&&!this.busy()&&!this.saving())window.print();}
}
