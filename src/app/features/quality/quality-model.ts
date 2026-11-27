export interface QualityCapabilities{permissions:Record<string,boolean>;userGuid:string}
export type QualityKind='Qc'|'Committee'|'Audit'|'Training';
export const KINDS:Record<QualityKind,string>={Qc:'کنترل کیفیت آزمایشگاه',Committee:'کمیته انتقال خون',Audit:'ممیزی و ارزیابی',Training:'آموزش هموویژیلانس'};
export const CATEGORIES:Record<string,string>={Refrigerator:'یخچال',Freezer:'فریزر',Incubator:'انکوباتور',Centrifuge:'سانتریفیوژ',WaterBath:'بن‌ماری',Analyzer:'آنالایزر',Transport:'حمل',Other:'سایر'};
export const EQUIPMENT_STATUS:Record<string,string>={Operational:'عملیاتی ثبت‌شده',Hold:'توقف فنی',Archived:'آرشیوشده',Due:'سررسید گذشته'};
export const SERVICE_KINDS:Record<string,string>={Calibration:'کالیبراسیون',Maintenance:'سرویس ادواری',Repair:'تعمیر',Qualification:'ارزیابی صلاحیت فنی'};
export const URGENCIES:Record<string,string>={Routine:'عادی',Urgent:'فوری',Critical:'بحرانی'};
export const SHIFTS:Record<string,string>={Morning:'صبح',Evening:'عصر',Night:'شب',Other:'سایر'};
export const QUALITY_STATUS:Record<string,string>={Draft:'پیش‌نویس',Submitted:'در انتظار بازبینی',Approved:'تأیید ثبت‌شده',Closed:'بسته‌شده',Open:'باز',InProgress:'در حال اجرا',Verified:'تأیید مستقل',Returned:'بازگشت برای اصلاح',Resolved:'رفع نقص ثبت‌شده'};
export const RESULTS:Record<string,string>={Accepted:'پذیرفته‌شده توسط کارشناس',Rejected:'مردود ثبت‌شده',Pending:'نیازمند بررسی'};
export const ATTENDANCE:Record<string,string>={Registered:'ثبت‌نام‌شده',Present:'حاضر',Absent:'غایب'};
export interface EquipmentRow{guid:string;code:string;name:string;category:string;brandModel:string;ward:string;serialNumber:string|null;status:string;calibrationAt:string|null;calibrationDueAt:string|null;maintenanceDueAt:string|null;version:string}
export interface EquipmentEvent{kind:string;previousStatus:string;newStatus:string;occurredAt:string;actorUserGuid:string;notes:string;reference:string|null;provider:string|null;dueAt:string|null;evidenceJson:string|null}
export interface Incident{guid:string;equipmentGuid:string;code:string;equipmentName:string;incidentNumber:string;urgency:string;status:string;reportedAt:string;description:string;reporterUserGuid:string;resolution:string|null;resolutionReference:string|null;resolvedAt:string|null;version:string;equipmentVersion:string}
export interface Temperature{guid:string;equipmentCode:string;measuredAt:string;recordedAt:string;temperature:number;assessment:string;notes:string|null;actorUserGuid:string}
export interface EquipmentDetail{equipment:EquipmentRow;events:EquipmentEvent[];incidents:Incident[];temperatures:Temperature[];storedUnits:number;demo:boolean}
export interface EquipmentSummary{total:number;operational:number;hold:number;archived:number;serviceDue:number;openIncidents:number;legacyCodes:number;unregisteredCodes:string[]}
export interface QualityRow{guid:string;kind:QualityKind;number:string;title:string;ward:string;status:string;occurredAt:string;createdByUserGuid:string;reviewedAt:string|null;version:string;demo:boolean}
export interface QualityLine{guid:string;title:string;data:Record<string,any>;status:string;ownerUserGuid:string|null;dueAt:string|null;progress:number;evidence:string|null;verifiedBy:string|null;verifiedAt:string|null;version:string}
export interface QualityEvent{action:string;previousStatus:string;newStatus:string;occurredAt:string;actorUserGuid:string;actorRoleGuid:string;notes:string;evidenceJson:string|null}
export interface QualityDetail{record:QualityRow;header:Record<string,any>;lines:QualityLine[];events:QualityEvent[];reviewNotes:string|null;reviewedBy:string|null;auditScore:number|null;auditMaximum:number|null}
export interface Owner{userGuid:string;name:string}
export interface FacilityEvent{occurredAt:string;actorUserGuid:string;notes:string;previousJson:string|null;currentJson:string}
export interface Facility{facilityName:string;accreditationCode:string|null;chair:string|null;secretary:string|null;officer:string|null;bloodCenter:string|null;bloodCenterCode:string|null;reportFooter:string|null;version:string|null;history?:FacilityEvent[]|null}
export interface QualityStats{qcRecords:number;qcAwaitingReview:number;committeeMeetings:number;openResolutions:number;overdueResolutions:number;audits:number;trainingCourses:number;attendanceRecords:number;present:number;equipmentIncidents:number;reactionCases:number;products:{productCode:string;received:number;started:number;completed:number;discarded:number}[];completedByWard:{key:string;count:number}[]}
export const key=(kind:QualityKind,action:string)=>kind[0].toLowerCase()+kind.slice(1)+action;
export function allowedRecordActions(r:QualityRow,c:QualityCapabilities|null):string[]{
 if(!c)return [];const can=(action:string)=>c.permissions[key(r.kind,action)]===true;
 if(r.status==='Draft'&&r.createdByUserGuid===c.userGuid&&can('Submit'))return ['Submit'];
 if(r.status==='Submitted'&&r.createdByUserGuid!==c.userGuid&&can('Approve'))return ['Approve','Reject'];
 if(r.kind==='Committee'&&r.status==='Approved'&&r.createdByUserGuid!==c.userGuid&&can('Close'))return ['Close'];return [];
}
export function allowedResolutionActions(r:QualityRow,l:QualityLine,c:QualityCapabilities|null):string[]{
 if(!c||r.kind!=='Committee'||r.status!=='Approved')return [];
 if(c.permissions['committeeProgress']&&l.ownerUserGuid===c.userGuid&&['Open','InProgress','Returned'].includes(l.status))return ['Progress'];
 if(c.permissions['committeeVerify']&&l.ownerUserGuid!==c.userGuid&&r.createdByUserGuid!==c.userGuid&&l.status==='Submitted')return ['Verify','Return'];return [];
}
export function equipmentDue(e:EquipmentRow,now=Date.now()){return e.status!=='Archived'&&[e.calibrationDueAt,e.maintenanceDueAt].some(x=>x&&Date.parse(/(?:Z|[+-]\d\d:\d\d)$/i.test(x)?x:x+'Z')<=now);}
export function equipmentActions(d:EquipmentDetail,c:QualityCapabilities|null):string[]{if(!c||d.equipment.status==='Archived')return [];const p=c.permissions,e=d.equipment,out:string[]=[];
 if(e.status==='Hold'&&p['equipmentEdit'])out.push('Edit');if(p['equipmentService'])out.push('Service');if(e.status==='Operational'&&p['equipmentHold'])out.push('Hold');if(e.status==='Hold'&&p['equipmentRelease']&&!d.incidents.some(x=>x.status==='Open')&&!equipmentDue(e))out.push('Release');
 if(e.status==='Hold'&&p['equipmentArchive']&&!d.storedUnits&&!d.incidents.some(x=>x.status==='Open'))out.push('Archive');if(p['equipmentTemperature'])out.push('Temperature');if(p['incidentReport'])out.push('IncidentReport');return out;}
export function statusColor(s:string){return ['Operational','Approved','Verified','Closed','Resolved'].includes(s)?'Verified':['Hold','Returned','Rejected','Due'].includes(s)?'Mismatch':'Pending';}
