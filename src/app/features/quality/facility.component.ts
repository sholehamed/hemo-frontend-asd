import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {message} from '../../shared/admission-utils';
import {Facility} from './quality-model';
import {bankDateTime} from '../blood-bank/bank-time';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,MatButtonModule,RequestStateComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">HEMO / تنظیمات</p><h1>اطلاعات پایه مرکز و مراجع گزارش</h1></section>
@if(auth.loading()){<app-request-state [loading]="true" [error]="null"/>}@else if(!auth.qualityCan('facility')){<section class="panel"><h2>مجوز مشاهده اطلاعات مرکز ندارید.</h2></section>}@else{
<div class="notice info">این صفحه فقط اطلاعات پایه مرکز HEMO را نگه می‌دارد. تنظیمات امنیتی، آستانه بالینی، HIS، SMS، بکاپ و کلیدهای سرویس بدون قرارداد و مجوز سازمانی تغییر نمی‌کنند.</div><app-request-state [loading]="busy()||saving()" [error]="error()"/>@if(success()){<div class="notice success">{{success()}}</div>}
@if(loaded()){<section class="panel"><h2>مشخصات مرکز</h2><form class="form-grid" (ngSubmit)="save()"><label>نام مرکز *<input name="name" [(ngModel)]="form.facilityName" maxlength="200" required [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>کد اعتباربخشی<input name="accreditation" [(ngModel)]="form.accreditationCode" maxlength="100" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>رئیس مرکز / کمیته<input name="chair" [(ngModel)]="form.chair" maxlength="200" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>دبیر کمیته<input name="secretary" [(ngModel)]="form.secretary" maxlength="200" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>مسئول هموویژیلانس<input name="officer" [(ngModel)]="form.officer" maxlength="200" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>مرکز انتقال خون پشتیبان<input name="bloodCenter" [(ngModel)]="form.bloodCenter" maxlength="200" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label>کد پایگاه<input name="bloodCenterCode" [(ngModel)]="form.bloodCenterCode" maxlength="100" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></label><label class="wide">پانویس گزارش‌های داخلی<textarea name="footer" [(ngModel)]="form.reportFooter" maxlength="1000" [disabled]="busy()||saving()||!auth.qualityCan('facilitySave')"></textarea></label>@if(auth.qualityCan('facilitySave')){<label class="wide">شرح تغییر *<textarea [disabled]="busy()||saving()" name="notes" [(ngModel)]="notes" required maxlength="4000"></textarea></label><button mat-flat-button class="primary-button" [disabled]="busy()||saving()">ذخیره اطلاعات پایه</button>}<button mat-stroked-button type="button" [disabled]="busy()" (click)="load()">دریافت مجدد</button></form></section><section class="panel"><h2>تاریخچه تغییرات (۱۰۰ مورد اخیر)</h2><div class="table-wrap"><table><thead><tr><th>زمان</th><th>شناسه کاربر</th><th>دلیل</th><th>قبل / بعد</th></tr></thead><tbody>@for(e of form.history??[];track $index){<tr><td>{{date(e.occurredAt)}}</td><td>{{e.actorUserGuid}}</td><td>{{e.notes}}</td><td><details><summary>جزئیات تغییر</summary><p>قبل</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">{{e.previousJson||'—'}}</pre><p>بعد</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">{{e.currentJson}}</pre></details></td></tr>}@empty{<tr><td colspan="4">تغییری ثبت نشده است.</td></tr>}</tbody></table></div></section>}}
} @else {<p role="alert">نقش یا نشست تغییر کرده است.</p>}
`})
export class FacilityComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);readonly loaded=signal(false);readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly date=bankDateTime;
 form:Facility={facilityName:'',accreditationCode:null,chair:null,secretary:null,officer:null,bloodCenter:null,bloodCenterCode:null,reportFooter:null,version:null};notes='';
 private clear(){this.loaded.set(false);this.form={facilityName:'',accreditationCode:null,chair:null,secretary:null,officer:null,bloodCenter:null,bloodCenterCode:null,reportFooter:null,version:null};this.notes='';}
 async ngOnInit(){await this.auth.load();if(this.auth.qualityCan('facility'))await this.load();}
 ngOnDestroy(){this.scope.invalidate();this.clear();this.success.set(null);}
 async load(){if(!this.auth.qualityCan('facility')||this.busy()||this.saving())return;this.busy.set(true);this.error.set(null);this.clear();try{const data=await this.api.facility();if(this.scope.isCurrent()){this.form=data;this.loaded.set(true);}}catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}}
 async save(){if(!this.loaded()||!this.auth.qualityCan('facility')||!this.auth.qualityCan('facilitySave')||this.busy()||this.saving())return;this.error.set(null);this.success.set(null);
   if(!this.form.facilityName.trim()||!this.notes.trim()){this.error.set('نام مرکز و شرح تغییر لازم است.');return;}if(!window.confirm('اطلاعات پایه مرکز ذخیره شود؟'))return;
   this.saving.set(true);try{const {history,...input}=this.form;await this.api.saveFacility({...input,notes:this.notes});if(!this.scope.isCurrent())return;this.saving.set(false);await this.load();if(this.scope.isCurrent())this.success.set('اطلاعات پایه ثبت شد.');}
   catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.saving.set(false);}
 }
}
