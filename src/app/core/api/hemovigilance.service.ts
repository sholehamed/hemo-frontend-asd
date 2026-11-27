import {Injectable,inject} from '@angular/core';
import {HemoCompanyHttp} from './hemo-company-http';
import {firstValueFrom} from 'rxjs';
import {BankPage} from '../../features/blood-bank/bank-model';
import {HvCapabilities,CaseRow,HvDetail,Candidate,Owner,Filters,Summary,ReactionInput,ReviewAction,ReviewInput,CapaCreateInput,CapaAction,CapaActionInput,ReportInput,ReportRow,ReportDetail} from '../../features/hemovigilance/hv-model';
@Injectable({providedIn:'root'})
export class HemovigilanceService{
 private http=inject(HemoCompanyHttp);private url='/Identity/Hemovigilance';
 capabilities(){return firstValueFrom(this.http.get<HvCapabilities>(this.url+'/Capabilities'));}
 list(f:Filters={}){return firstValueFrom(this.http.post<BankPage<CaseRow>>(this.url+'/List',f));}
 detail(id:string){return firstValueFrom(this.http.get<HvDetail>(this.url+'/Detail/'+encodeURIComponent(id)));}
 stats(f:Filters={}){return firstValueFrom(this.http.post<Summary>(this.url+'/Stats',f));}
 candidates(search='',pageNumber=1){return firstValueFrom(this.http.post<BankPage<Candidate>>(this.url+'/Candidates',{search,pageNumber,pageSize:20}));}
 owners(){return firstValueFrom(this.http.get<Owner[]>(this.url+'/Owners'));}
 report(v:ReactionInput){return firstValueFrom(this.http.post<string>(this.url+'/Report',v));}
 review(a:ReviewAction,v:ReviewInput){return firstValueFrom(this.http.post<void>(this.url+'/'+a,v));}
 assign(v:CapaCreateInput){return firstValueFrom(this.http.post<string>(this.url+'/AssignCapa',v));}
 capa(a:CapaAction,v:CapaActionInput){return firstValueFrom(this.http.post<void>(this.url+'/'+a,v));}
 reports(pageNumber=1){return firstValueFrom(this.http.post<BankPage<ReportRow>>(this.url+'/Reports',{pageNumber,pageSize:20}));}
 reportDetail(id:string){return firstValueFrom(this.http.get<ReportDetail>(this.url+'/ReportDetail/'+encodeURIComponent(id)));}
 archive(v:ReportInput){return firstValueFrom(this.http.post<string>(this.url+'/Archive',v));}
 reportExternal(guid:string,version:string,status:string,reference:string|null){return firstValueFrom(this.http.post<void>(this.url+'/ReportExternal',{guid,version,status,reference}));}
}
