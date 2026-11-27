import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {measuredFields,measuredUtc} from '../transfusion/transfer-time';
import {Candidate,SYMPTOMS,SEVERITIES,demo} from './hv-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./hv-create.component.html'})
export class HvCreateComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(HemovigilanceService);private router=inject(Router);private route=inject(ActivatedRoute);
 readonly page=signal<BankPage<Candidate>|null>(null);readonly selected=signal<Candidate|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly symptoms=Object.entries(SYMPTOMS);readonly severities=Object.entries(SEVERITIES);readonly date=bankDateTime;readonly product=productLabel;readonly fa=fa;readonly demo=demo;
 search=this.route.snapshot.queryParamMap.get('search')??'';private applied='';private selectedTransfer=this.route.snapshot.queryParamMap.get('transfer');
 flags:Record<string,boolean>={};onset=measuredFields();useNow=false;clientId='';
 form={severity:'',notes:'',actionsTaken:'',samplesSent:'',volumeMl:null as number|null};
 ngOnInit(){if(this.auth.hvCan('candidates'))void this.load();}
 async load(pageNumber=1){if(!this.auth.hvCan('candidates'))return;this.busy.set(true);this.error.set(null);if(pageNumber===1)this.applied=this.search;try{const p=await this.api.candidates(this.applied,pageNumber);this.page.set(p);const c=p.data.find(x=>x.guid===this.selectedTransfer);if(c&&!this.selected())this.choose(c);}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 choose(c:Candidate){this.selected.set(c);this.clientId=globalThis.crypto?.randomUUID?.()??'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,k=>{const v=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (k==='x'?v:(v&3)|8).toString(16);});this.flags={};this.onset=measuredFields();this.useNow=false;this.form={severity:'',notes:'',actionsTaken:'',samplesSent:'',volumeMl:null};this.error.set(null);}
 async save(){const c=this.selected(),v=this.form;if(!c||this.busy()||!this.auth.hvCan('report'))return;this.error.set(null);try{
 const symptoms=Object.keys(this.flags).filter(k=>this.flags[k]);if(!symptoms.length||symptoms.includes('Unknown')&&symptoms.length>1||!v.severity||!v.notes.trim()||!v.actionsTaken.trim())throw new Error('علائم مشاهده‌شده یا نامشخص، درجه ثبت‌شده و شرح گزارش/اقدامات واقعی را تکمیل کنید.');
 const onsetAt=this.useNow?new Date().toISOString():measuredUtc(this.onset.date,this.onset.time);
 if(!window.confirm('گزارش مشاهده‌شده به پرونده مرتبط ثبت شود؟'))return;this.busy.set(true);
 const id=await this.api.report({transferGuid:c.guid,transferVersion:c.version,clientReportId:this.clientId,onsetAt,symptoms,initialSeverity:v.severity,notes:v.notes,actionsTaken:v.actionsTaken,samplesSent:v.samplesSent||null,volumeMl:v.volumeMl});await this.router.navigate(['/hemo/hv/detail',id]);
 }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
