import { Injectable,inject } from '@angular/core';
import { HemoCompanyHttp } from './hemo-company-http';
import { firstValueFrom } from 'rxjs';
import { BankCapabilities,BankPage,BankStats,UnitRow,UnitDetail,InventoryFilters,TemperatureView,TemperatureFilters,ReceiveInput,UnitActionInput,LabInput,TemperatureInput,LabReportRow,LabHistoryFilters } from '../../features/blood-bank/bank-model';
@Injectable({providedIn:'root'})
export class BloodBankService{
 private http=inject(HemoCompanyHttp);private url='/Identity/BloodBank';
 capabilities(){return firstValueFrom(this.http.get<BankCapabilities>(this.url+'/Capabilities'));}
 inventory(input:InventoryFilters={}){return firstValueFrom(this.http.post<BankPage<UnitRow>>(this.url+'/Inventory',input));}
 unit(guid:string){return firstValueFrom(this.http.get<UnitDetail>(this.url+'/Unit/'+encodeURIComponent(guid)));}
 stats(){return firstValueFrom(this.http.post<BankStats>(this.url+'/Stats',{}));}
 temperatures(input:TemperatureFilters={}){return firstValueFrom(this.http.post<BankPage<TemperatureView>>(this.url+'/TemperatureHistory',input));}
 labHistory(input:LabHistoryFilters={}){return firstValueFrom(this.http.post<BankPage<LabReportRow>>(this.url+'/LabHistory',input));}
 receive(input:ReceiveInput){return firstValueFrom(this.http.post<string>(this.url+'/Receive',input));}
 lab(input:LabInput){return firstValueFrom(this.http.post<string>(this.url+'/Test',input));}
 temperature(input:TemperatureInput){return firstValueFrom(this.http.post<string>(this.url+'/Temperature',input));}
 action(input:UnitActionInput){const path=['StartThaw','FinishThaw'].includes(input.action)?'Thaw':input.action;return firstValueFrom(this.http.post<void>(this.url+'/'+path,input));}
 returnRequest(input:{requestGuid:string;version:string;reason:string}){return firstValueFrom(this.http.post<void>(this.url+'/ReturnRequest',input));}
}
