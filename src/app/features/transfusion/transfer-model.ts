export type TransferStatus='Dispatched'|'Received'|'ReceiptHold'|'Verified'|'Witnessed'|'InProgress'|'Completed'|'Stopped'|'Returning'|'Returned'|'Disposed';
export type TransferAction='Receive'|'ReceiptHold'|'Verify'|'Witness'|'Start'|'Complete'|'Stop'|'Return'|'AcceptReturn'|'Dispose'|'DoctorNote';
export type VitalPhase='T0'|'T15'|'Mid'|'End'|'Post1h';
export const STATUSES:Record<TransferStatus,string>={Dispatched:'ارسال‌شده',Received:'دریافت بخش',ReceiptHold:'مغایرت دریافت',Verified:'تطبیق اول',Witnessed:'تطبیق دو نفره',InProgress:'در حال تزریق',Completed:'پایان ثبت‌شده',Stopped:'توقف ثبت‌شده',Returning:'در مسیر مرجوعی',Returned:'مرجوع و قرنطینه',Disposed:'امحای ثبت‌شده'};
export const ACTIONS:Record<TransferAction,string>={Receive:'تأیید دریافت بخش',ReceiptHold:'ثبت مغایرت دریافت',Verify:'ثبت تطبیق اول',Witness:'تأیید مستقل شاهد',Start:'ثبت شروع تزریق',Complete:'ثبت پایان تزریق',Stop:'ثبت توقف تزریق',Return:'ارسال مرجوعی',AcceptReturn:'تأیید دریافت مرجوعی',Dispose:'ثبت امحای مرجوعی',DoctorNote:'ثبت یادداشت پزشک'};
export const PHASES:Record<VitalPhase,string>={T0:'قبل از تزریق (T0)',T15:'نوبت ۱۵ دقیقه (T15)',Mid:'حین تزریق',End:'پایان تزریق',Post1h:'نوبت پیگیری یک ساعت'};
export interface TransferCapabilities {list:boolean;detail:boolean;stats:boolean;candidates:boolean;dispatch:boolean;receive:boolean;receiptHold:boolean;verify:boolean;witness:boolean;start:boolean;vital:boolean;complete:boolean;stop:boolean;return:boolean;acceptReturn:boolean;dispose:boolean;doctorNote:boolean;userGuid:string}
export type CapabilityKey=Exclude<keyof TransferCapabilities,'userGuid'>;
export interface TransferRow {guid:string;transferNumber:string;unitGuid:string;requestGuid:string;admissionGuid:string;patientName:string;hisNumber:string;ward:string;unitCode:string;productCode:string;bloodGroup:string;status:TransferStatus;dispatchedAt:string;receivedAt:string|null;startedAt:string|null;endedAt:string|null;suspectedReaction:boolean;version:string}
export interface Candidate {unitGuid:string;unitVersion:string;unitCode:string;productCode:string;bloodGroup:string;expiresAt:string;requestGuid:string;requestNumber:string;patientName:string;hisNumber:string;ward:string;wristbandCode:string}
export interface TransferEvent {action:string;previousStatus:string;newStatus:TransferStatus;occurredAt:string;actorUserGuid:string;actorRoleGuid:string;notes:string|null;evidenceJson:string|null}
export interface VitalView {guid:string;phase:VitalPhase;measuredAt:string;recordedAt:string;systolic:number;diastolic:number;pulse:number;temperature:number;spo2:number;respiration:number;urineMl:number|null;notes:string|null;actorUserGuid:string}
export interface TransferDetail {transfer:TransferRow;wristbandCode:string;requestNumber:string;labReportReference:string;labRecordedAt:string;expiresAt:string;carrierName:string;carrierCode:string;containerCode:string;dispatchTemperature:number;transportIndicator:string;packCount:number|null;verifiedBy:string|null;witnessedBy:string|null;startedBy:string|null;admissionChanged:boolean;canProceed:boolean;demo:boolean;events:TransferEvent[];vitals:VitalView[]}
export interface TransferStats {total:number;dispatched:number;received:number;receiptHold:number;verified:number;witnessed:number;inProgress:number;completed:number;stopped:number;returning:number;returned:number;disposed:number;suspectedReactions:number}
export interface TransferFilters {search?:string;status?:string;ward?:string;admissionGuid?:string;requestGuid?:string;from?:string;to?:string;pageNumber?:number;pageSize?:number}
export interface CandidateFilters {search?:string;requestGuid?:string;pageNumber?:number;pageSize?:number}
export interface DispatchInput {unitGuid:string;unitVersion:string;unitCode:string;wristbandCode:string;carrierName:string;carrierCode:string;containerCode:string;temperature:number;transportIndicator:string;packCount:number|null;checks:number;notes:string}
export interface ActionInput {guid:string;version:string;unitCode?:string;wristbandCode?:string;checks:number;notes:string;temperature?:number|null;condition?:string;receiverName?:string;needleReference?:string;suspectedReaction:boolean}
export interface VitalInput {guid:string;version:string;phase:VitalPhase;measuredAt:string;systolic:number;diastolic:number;pulse:number;temperature:number;spo2:number;respiration:number;urineMl:number|null;notes:string|null}
export function allowedActions(d:TransferDetail,c:TransferCapabilities|null):TransferAction[]{
 if(!c)return [];const t=d.transfer,s=t.status,out:TransferAction[]=[];
 if(s==='Dispatched'){if(c.receive&&d.canProceed)out.push('Receive');if(c.receiptHold)out.push('ReceiptHold');}
 if(d.canProceed&&['Received','Verified','Witnessed'].includes(s)&&c.verify)out.push('Verify');
 if(d.canProceed&&s==='Verified'&&c.witness&&d.verifiedBy&&d.verifiedBy!==c.userGuid)out.push('Witness');
 if(d.canProceed&&s==='Witnessed'&&c.start&&d.verifiedBy===c.userGuid&&!t.suspectedReaction)out.push('Start');
 if(s==='InProgress'){if(c.complete&&!t.suspectedReaction)out.push('Complete');if(c.stop)out.push('Stop');}
 if(c.return&&['Dispatched','Received','ReceiptHold','Verified','Witnessed','Stopped'].includes(s))out.push('Return');
 if(c.acceptReturn&&s==='Returning')out.push('AcceptReturn');
 if(c.dispose&&s==='Returned')out.push('Dispose');
 if(c.doctorNote)out.push('DoctorNote');
 return out;
}
export function allowedPhases(s:TransferStatus):VitalPhase[]{
 if(['Verified','Witnessed'].includes(s))return ['T0'];
 if(s==='InProgress')return ['T15','Mid','End'];
 if(['Completed','Stopped','Returning','Returned','Disposed'].includes(s))return ['Post1h'];
 return [];
}
export function codeMatches(unit:string,band:string,expectedUnit:string,expectedBand:string){return unit.trim()===expectedUnit&&band.trim()===expectedBand;}
export function statusClass(s:TransferStatus){return ['Completed','Witnessed','Received'].includes(s)?'Verified':['ReceiptHold','Stopped','Returned','Disposed'].includes(s)?'Mismatch':'Pending';}
export const CHECKS=['تطبیق هویت و شماره پرونده با مچ‌بند و حواله','تطبیق شناسه واحد، فرآورده و لیبل','بررسی مستند نتیجه آزمایش و دستور پزشک','بررسی ظاهر، سلامت بسته و تاریخ انقضا','بررسی مستند شرایط حمل / نگهداری و الزامات مصوب مرکز'];
