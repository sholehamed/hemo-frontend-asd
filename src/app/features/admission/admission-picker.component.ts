import { Component,OnDestroy,inject,input,output,signal } from '@angular/core';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { AdmissionPageAccess } from './admission-page-access';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionsService,AdmissionView } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { message,label } from '../../shared/admission-utils';
import { normalizeDigits } from '../../shared/jalali-date';
@Component({selector:'app-admission-picker',standalone:true,imports:[FormsModule,MatButtonModule,RequestStateComponent],template:`
<section class="panel no-print"><h2>انتخاب پرونده بیمار</h2><form (ngSubmit)="find()" class="actions"><input name="search" [(ngModel)]="search" placeholder="نام، شناسه، شماره پرونده یا بارکد" style="flex:1;min-width:200px"><button mat-flat-button class="primary-button" [disabled]="busy()||disabled()">جستجو</button><button mat-stroked-button type="button" [disabled]="disabled()" (click)="search='';find()">پذیرش‌های اخیر</button></form><app-request-state [loading]="busy()" [error]="error()"/>
@if(rows().length){<div class="table-wrap"><table><thead><tr><th>بیمار / پرونده</th><th>بخش</th><th>وضعیت</th><th></th></tr></thead><tbody>@for(p of rows();track p.guid){<tr><td>{{p.firstName}} {{p.lastName}}<br><small class="mono">{{p.hisNumber}}</small></td><td>{{p.ward}}</td><td><span class="status-pill" [class]="p.identityStatus">{{label(p.identityStatus)}}</span></td><td><button mat-button [disabled]="disabled()" (click)="choose(p.guid)">بررسی پرونده</button></td></tr>}</tbody></table></div>@if(more()){<p class="muted">حداکثر ۲۰ نتیجه نمایش داده شده؛ جستجو را دقیق‌تر کنید.</p>}}@else if(searched()&&!busy()){<p class="muted">پرونده‌ای یافت نشد.</p>}
</section>`})
export class AdmissionPickerComponent implements OnDestroy{
 readonly disabled=input(false);private readonly scope=inject(HemoPageScope,{optional:true});private readonly access=inject(AdmissionPageAccess,{optional:true});private destroyed=false;
 private current(){return !this.destroyed&&(!this.scope||this.scope.isCurrent())&&(!this.access||this.access.can('list'));}
 choose(guid:string){if(this.current()&&!this.disabled())this.selected.emit(guid);}
 ngOnDestroy(){this.destroyed=true;++this.seq;this.rows.set([]);this.search='';}

 private api=inject(AdmissionsService);readonly selected=output<string>();readonly busy=signal(false);readonly error=signal<string|null>(null);readonly rows=signal<AdmissionView[]>([]);readonly searched=signal(false);readonly more=signal(false);readonly label=label;search='';private seq=0;
 async find(){if(!this.current()||this.disabled())return;const n=++this.seq;this.busy.set(true);this.error.set(null);try{const result=await this.api.list({search:normalizeDigits(this.search).trim(),pageNumber:1,pageSize:20});if(this.current()&&n===this.seq){this.rows.set(result.data);this.more.set(result.hasNextPage);this.searched.set(true);}}catch(e){if(this.current()&&n===this.seq){this.rows.set([]);this.error.set(message(e));}}finally{if(this.current()&&n===this.seq)this.busy.set(false);}}
}
