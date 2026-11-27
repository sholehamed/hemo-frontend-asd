import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RequestInput,RequestDetail,RequestPage,RequestFilters,RequestStats,RequestCapabilities,DecisionInput } from '../../features/blood-requests/blood-request-model';
@Injectable({providedIn:'root'})
export class BloodRequestsService {
 private http=inject(HttpClient);private url='/Identity/BloodRequest';
 capabilities(){return firstValueFrom(this.http.get<RequestCapabilities>(this.url+'/Capabilities'));}
 list(filters:RequestFilters){return firstValueFrom(this.http.post<RequestPage>(this.url+'/BindPaging',filters));}
 bank(filters:RequestFilters){return firstValueFrom(this.http.post<RequestPage>(this.url+'/BankQueue',filters));}
 stats(mine=false){return firstValueFrom(this.http.post<RequestStats>(this.url+'/Stats',{mine}));}
 get(guid:string,bank=false){return firstValueFrom(this.http.get<RequestDetail>(this.url+(bank?'/Bank/':'/')+encodeURIComponent(guid)));}
 create(input:RequestInput,source:'Nurse'|'Doctor'){return firstValueFrom(this.http.post<string>(this.url+'/'+source,input));}
 update(guid:string,version:string,input:RequestInput){return firstValueFrom(this.http.put<void>(this.url,{guid,version,input}));}
 transition(input:DecisionInput){const suffix=input.action==='Submit'?'Submit':input.action==='Cancel'?'Cancel':'Decide';return firstValueFrom(this.http.post<void>(this.url+'/'+suffix,input));}
}
