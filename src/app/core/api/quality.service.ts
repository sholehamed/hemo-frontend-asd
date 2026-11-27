import {Injectable,inject} from '@angular/core';
import {HemoCompanyHttp} from './hemo-company-http';
import {firstValueFrom} from 'rxjs';
import {BankPage} from '../../features/blood-bank/bank-model';
import {QualityCapabilities,EquipmentRow,EquipmentDetail,EquipmentSummary,Incident,QualityRow,QualityDetail,QualityKind,Owner,Facility,QualityStats} from '../../features/quality/quality-model';
@Injectable({providedIn:'root'})
export class QualityService{
 private http=inject(HemoCompanyHttp);private url='/Identity/HemoQuality';
 private post<T>(path:string,input:unknown={}){return firstValueFrom(this.http.post<T>(this.url+'/'+path,input));}
 private get<T>(path:string){return firstValueFrom(this.http.get<T>(this.url+'/'+path));}
 capabilities(){return this.get<QualityCapabilities>('Capabilities');}
 equipmentList(input:unknown={}){return this.post<BankPage<EquipmentRow>>('EquipmentList',input);}
 equipmentDetail(id:string){return this.get<EquipmentDetail>('EquipmentDetail/'+encodeURIComponent(id));}
 equipmentStats(){return this.post<EquipmentSummary>('EquipmentStats');}
 incidents(input:unknown={}){return this.post<BankPage<Incident>>('Incidents',input);}
 equipmentCreate(input:unknown){return this.post<string>('EquipmentCreate',input);}
 equipmentAction(action:string,input:unknown){return this.post<void>(action.startsWith('Incident')?action:'Equipment'+action,input);}
 list(kind:QualityKind,input:unknown={}){return this.post<BankPage<QualityRow>>(kind+'List',input);}
 detail(kind:QualityKind,id:string){return this.get<QualityDetail>(kind+'Detail/'+encodeURIComponent(id));}
 owners(kind:QualityKind){return this.get<Owner[]>(kind+'Owners');}
 create(kind:QualityKind,input:unknown){return this.post<string>(kind+'Create',input);}
 action(kind:QualityKind,action:string,input:unknown){return this.post<void>(kind+action,input);}
 facility(){return this.get<Facility>('Facility');}
 saveFacility(input:unknown){return this.post<void>('FacilitySave',input);}
 stats(input:unknown={}){return this.post<QualityStats>('Stats',input);}
}
