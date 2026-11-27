import { Component,ElementRef,effect,input,signal,viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionView } from '../../core/api/admissions.service';
import { isoToJalali } from '../../shared/jalali-date';
declare const JsBarcode:(element:SVGElement,value:string,options:Record<string,unknown>)=>void;
@Component({selector:'app-wristband',standalone:true,imports:[MatButtonModule],template:`
<section class="panel"><h2>مچ‌بند و بارکد هویتی بیمار</h2>
<div class="wristband print-target" [class.alert]="patient().allergy"><div class="wristband-head"><strong>HEMO — مچ‌بند هویتی</strong><span>{{patient().allergy?'هشدار سابقه آلرژی':'شناسه پرونده'}}</span></div>
<strong>{{patient().firstName}} {{patient().lastName}}</strong><div>شماره پرونده: <span class="mono">{{patient().hisNumber}}</span> | تولد: {{date(patient().birthDate)}}</div><div>شناسه: <span class="mono">{{patient().identificationNumber}}</span></div><svg #barcode aria-label="بارکد مچ‌بند" dir="ltr"></svg><small class="mono">{{patient().wristbandCode}}</small></div>
@if(error()){<div class="notice warn">{{error()}}</div>}
<div class="actions"><button mat-flat-button class="primary-button" [disabled]="!!error()" (click)="print()">چاپ مچ‌بند</button><span class="muted">پیش از استفاده، خوانایی بارکد با اسکنر و قالب چاپگر مرکز بررسی شود.</span></div>
</section>`,styles:[`.wristband{background:white;border:2px solid #1b2332;padding:12px 15px;max-width:540px;border-radius:8px;font-size:12px;overflow:hidden}.wristband.alert{border-color:#c8102e}.wristband-head{display:flex;justify-content:space-between;border-bottom:1px solid #e2e6ea;margin-bottom:8px}.wristband svg{display:block;max-width:100%;height:auto;margin:5px auto}.wristband small{display:block;text-align:center;overflow-wrap:anywhere}.wristband>strong{font-size:18px}@media print{.wristband{max-width:100%;width:100%;position:absolute;inset:0 auto auto 0;border-radius:0;box-shadow:none}}`]})
export class WristbandComponent{
 readonly patient=input.required<AdmissionView>();readonly svg=viewChild<ElementRef<SVGElement>>('barcode');readonly error=signal<string|null>(null);readonly date=isoToJalali;
 constructor(){effect(()=>{const element=this.svg()?.nativeElement;if(!element)return;const code=this.patient().wristbandCode;if(!code)return;try{JsBarcode(element,code,{format:'CODE128',displayValue:false,width:1.2,height:52,margin:4});this.error.set(null);}catch{this.error.set('بارکد قابل تولید نیست.');}});}
 print(){window.print();}
}
