import { Component,input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView } from '../../core/api/admissions.service';
import { isoToJalali } from '../../shared/jalali-date';
import { label } from '../../shared/admission-utils';
@Component({selector:'app-admission-table',standalone:true,imports:[RouterLink,MatButtonModule],template:`
<div class="table-wrap"><table>
<thead><tr><th>نام بیمار / شماره پرونده</th><th>شناسه هویتی</th><th>بخش و تخت</th><th>گروه خونی</th><th>وضعیت هویت</th><th>پذیرش</th><th>عملیات</th></tr></thead>
<tbody>@for(a of rows();track a.guid){<tr>
<td><strong>{{a.firstName}} {{a.lastName}}</strong><br><span class="muted mono">{{a.hisNumber}}</span></td>
<td><span class="mono">{{a.identificationNumber}}</span></td><td>{{a.ward}} / {{a.bedNumber}}</td><td><strong dir="ltr">{{a.bloodGroup||'—'}}</strong></td>
<td><span class="status-pill" [class]="a.identityStatus">{{label(a.identityStatus)}}</span>@if(a.allergy||a.alloantibody||a.transfusionHistory==='Reaction'){<br><span class="status-pill Mismatch">هشدار سابقه</span>}</td>
<td>{{date(a.admittedAt)}}<br><small>{{label(a.status)}}</small></td>
<td><div class="actions compact-actions"><a mat-button [routerLink]="['/admission/detail',a.guid]">جزئیات / مچ‌بند</a><a mat-button [routerLink]="['/admission/identity']" [queryParams]="{guid:a.guid}">تطبیق</a></div></td>
</tr>}@empty{<tr><td colspan="7" class="muted">پرونده‌ای برای نمایش وجود ندارد.</td></tr>}</tbody></table></div>`,styles:['.compact-actions{gap:0;margin:0}.compact-actions a{font-size:11px;padding:0 5px;min-width:auto}']})
export class AdmissionTableComponent {readonly rows=input.required<AdmissionView[]>();readonly label=label;readonly date=isoToJalali;}
