import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BankPage } from '../../features/blood-bank/bank-model';
import { TransferRow,TransferDetail,TransferStats,TransferFilters,Candidate,CandidateFilters,DispatchInput,TransferAction,ActionInput,VitalInput } from '../../features/transfusion/transfer-model';
@Injectable({providedIn:'root'})
export class TransfusionService{
 private http=inject(HttpClient);private url='/Identity/Transfusion';
 list(f:TransferFilters={}){return firstValueFrom(this.http.post<BankPage<TransferRow>>(this.url+'/List',f));}
 detail(guid:string){return firstValueFrom(this.http.get<TransferDetail>(this.url+'/Detail/'+encodeURIComponent(guid)));}
 stats(){return firstValueFrom(this.http.post<TransferStats>(this.url+'/Stats',{}));}
 candidates(f:CandidateFilters={}){return firstValueFrom(this.http.post<BankPage<Candidate>>(this.url+'/Candidates',f));}
 dispatch(v:DispatchInput){return firstValueFrom(this.http.post<string>(this.url+'/Dispatch',v));}
 action(action:TransferAction,v:ActionInput){return firstValueFrom(this.http.post<void>(this.url+'/'+action,v));}
 vital(v:VitalInput){return firstValueFrom(this.http.post<string>(this.url+'/Vital',v));}
}
