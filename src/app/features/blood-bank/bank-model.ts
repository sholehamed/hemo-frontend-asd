export type UnitStatus='ReceivedHold'|'Available'|'Reserved'|'Thawing'|'Ready'|'Quarantined'|'Discarded';
export type BankAction='Inspect'|'Reserve'|'StartThaw'|'FinishThaw'|'Ready'|'Hold'|'Unreserve'|'Discard';
export const UNIT_STATUS:Record<UnitStatus,string>={ReceivedHold:'در انتظار بازرسی',Available:'موجودی آزاد',Reserved:'رزرو شده',Thawing:'در حال ذوب',Ready:'آماده بررسی تحویل',Quarantined:'قرنطینه',Discarded:'امحا ثبت شده'};
export const BANK_ACTION:Record<string,string>={Receive:'دریافت',Inspect:'تأیید بازرسی',Reserve:'رزرو',StartThaw:'شروع ذوب',FinishThaw:'ثبت پایان ذوب',Ready:'آماده‌سازی تحویل',Hold:'قرنطینه',Unreserve:'لغو رزرو',Discard:'ثبت امحا',Test:'ثبت آزمایش',TemperatureHold:'توقف دمایی'};
export const LAB_RESULTS:Record<string,string>={NonReactive:'بدون واکنش',Reactive:'واکنش‌دار',NotPerformed:'انجام نشده / نامرتبط',Indeterminate:'نامشخص'};
export const ASSESSMENTS:Record<string,string>={Acceptable:'قابل قبول طبق ارزیابی',Concern:'نگرانی / انحراف',Unknown:'نامشخص'};
export const CONCLUSIONS:Record<string,string>={Accepted:'پذیرفته‌شده توسط کارشناس',Rejected:'مردود',Pending:'نیازمند بررسی'};
export const SECOND_SAMPLE:Record<string,string>={Confirmed:'تطبیق مستند',Discrepant:'مغایرت',Pending:'در انتظار'};
export interface BankCapabilities {inventory:boolean;unit:boolean;stats:boolean;temperatureHistory:boolean;receive:boolean;inspect:boolean;test:boolean;reserve:boolean;thaw:boolean;ready:boolean;hold:boolean;unreserve:boolean;discard:boolean;temperature:boolean;returnRequest:boolean;labHistory:boolean}
export interface UnitRow {guid:string;unitCode:string;productCode:string;bloodGroup:string;batchNumber:string|null;supplySource:string;equipmentCode:string;receivedAt:string;expiresAt:string;status:UnitStatus;expired:boolean;requestGuid:string|null;thawStartedAt:string|null;thawCompletedAt:string|null;version:string}
export interface UnitEvent {action:string;previousStatus:string;newStatus:UnitStatus;requestGuid:string|null;occurredAt:string;actorUserGuid:string;actorRoleGuid:string;reason:string|null;method:string|null;temperature:number|null;effectiveExpiry:string|null}
export interface LabView {guid:string;requestGuid:string;submissionAttempt:number;recordedAt:string;actorUserGuid:string;sampleReference:string;secondSample:string;labelGroup:string;method:string;immediateSpin:string;phase37:string;ahg:string;dat:string;antibodyScreen:string;reportReference:string;conclusion:string;notes:string|null}
export interface TemperatureView {guid:string;equipmentCode:string;measuredAt:string;recordedAt:string;temperature:number;assessment:string;notes:string|null;actorUserGuid:string}
export interface UnitDetail {unit:UnitRow;events:UnitEvent[];tests:LabView[];latestTemperature:TemperatureView|null}
export interface BankPage<T>{data:T[];pageNumber:number;totalCount:number;totalPages:number;hasPreviousPage:boolean;hasNextPage:boolean}
export interface BankStats {total:number;available:number;reserved:number;thawing:number;ready:number;hold:number;expired:number;expiringSoon:number;discarded:number;approvedRequests:number;temperatureConcerns:number;stock:BankStockCell[]}
export interface BankStockCell {productCode:string;bloodGroup:string;available:number}
export interface LabReportRow {unitCode:string;productCode:string;bloodGroup:string;requestNumber:string;test:LabView}
export interface LabHistoryFilters {search?:string;conclusion?:string;from?:string;to?:string;requestGuid?:string;pageNumber?:number;pageSize?:number}
export interface InventoryFilters {search?:string;product?:string;group?:string;status?:string;requestGuid?:string;equipment?:string;pageNumber?:number;pageSize?:number}
export interface TemperatureFilters {equipment?:string;assessment?:string;from?:string;to?:string;pageNumber?:number;pageSize?:number}
export interface ReceiveInput {unitCode:string;productCode:string;bloodGroup:string;batchNumber:string|null;supplySource:string;equipmentCode:string;receivedAt:string;expiresAt:string;notes:string|null}
export interface UnitActionInput {guid:string;version:string;action:BankAction;requestGuid?:string|null;requestVersion?:string|null;reason:string;method?:string|null;temperature?:number|null;effectiveExpiry?:string|null}
export interface LabInput {unitGuid:string;unitVersion:string;requestGuid:string;requestVersion:string;sampleReference:string;secondSample:string;labelGroup:string;method:string;immediateSpin:string;phase37:string;ahg:string;dat:string;antibodyScreen:string;reportReference:string;conclusion:string;notes:string|null}
export interface TemperatureInput {equipmentCode:string;measuredAt:string;temperature:number;assessment:string;notes:string|null}
export const needsThaw=(code:string)=>['FFP','Cryoprecipitate','CryoPoorPlasma'].includes(code);
export function availableActions(unit:UnitRow,caps:BankCapabilities|null):BankAction[]{
 if(!caps||unit.status==='Discarded')return [];
 const s=unit.status,out:BankAction[]=[];
 if(!unit.expired){
  if(caps.inspect&&['ReceivedHold','Quarantined'].includes(s)&&!unit.requestGuid&&!unit.thawStartedAt)out.push('Inspect');
  if(caps.reserve&&s==='Available'&&!unit.requestGuid)out.push('Reserve');
  if(caps.thaw&&s==='Reserved'&&needsThaw(unit.productCode)&&!unit.thawCompletedAt)out.push('StartThaw');
  if(caps.thaw&&s==='Thawing')out.push('FinishThaw');
  if(caps.ready&&s==='Reserved'&&(!needsThaw(unit.productCode)||!!unit.thawCompletedAt))out.push('Ready');
 }
 if(caps.hold&&['ReceivedHold','Available','Reserved','Thawing','Ready'].includes(s))out.push('Hold');
 if(caps.unreserve&&unit.requestGuid&&['Reserved','Ready','Thawing','Quarantined'].includes(s))out.push('Unreserve');
 if(caps.discard&&!unit.requestGuid&&['ReceivedHold','Quarantined'].includes(s))out.push('Discard');
 return out;
}
export function statusLabel(unit:UnitRow){return unit.expired&&unit.status!=='Discarded'?'منقضی (مسدود)':UNIT_STATUS[unit.status];}
