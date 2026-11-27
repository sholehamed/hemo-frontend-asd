import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BankPage,BankStats,UnitRow,UnitDetail,InventoryFilters,TemperatureView,TemperatureFilters,ReceiveInput,UnitActionInput,LabInput,TemperatureInput } from '../../features/blood-bank/bank-model';
@Injectable({providedIn:'root'})
export class BloodBankService{
 private http=inject(HttpClient);private url='/Identity/BloodBank';
 inventory(input:InventoryFilters={}){return firstValueFrom(this.http.post<BankPage<UnitRow>>(this.url+'/Inventory',input));}
 unit(guid:string){return firstValueFrom(this.http.get<UnitDetail>(this.url+'/Unit/'+encodeURIComponent(guid)));}
 stats(){return firstValueFrom(this.http.post<BankStats>(this.url+'/Stats',{}));}
 temperatures(input:TemperatureFilters={}){return firstValueFrom(this.http.post<BankPage<TemperatureView>>(this.url+'/TemperatureHistory',input));}
 receive(input:ReceiveInput){return firstValueFrom(this.http.post<string>(this.url+'/Receive',input));}
 lab(input:LabInput){return firstValueFrom(this.http.post<string>(this.url+'/Test',input));}
 temperature(input:TemperatureInput){return firstValueFrom(this.http.post<string>(this.url+'/Temperature',input));}
 action(input:UnitActionInput){const path=['StartThaw','FinishThaw'].includes(input.action)?'Thaw':input.action;return firstValueFrom(this.http.post<void>(this.url+'/'+path,input));}
 returnRequest(input:{requestGuid:string;version:string;reason:string}){return firstValueFrom(this.http.post<void>(this.url+'/ReturnRequest',input));}
}
