import type {VitalView} from '../transfusion/transfer-model';
export type HvStatus='Reported'|'DoctorReviewed'|'BankReviewed'|'RcaOpen'|'CapaMonitoring'|'ReadyToClose'|'Closed';
export type ReviewAction='Observe'|'DoctorReview'|'BankReview'|'Investigate'|'ReturnToDoctor'|'PublishRca'|'Close'|'External';
export type CapaAction='CapaProgress'|'CapaVerify'|'CapaReject';
export const STATUS:Record<HvStatus,string>={Reported:'در انتظار بررسی پزشک',DoctorReviewed:'در انتظار بررسی بانک',BankReviewed:'در انتظار بررسی مسئول',RcaOpen:'تحلیل ریشه‌ای باز',CapaMonitoring:'پیگیری CAPA',ReadyToClose:'آماده بازبینی نهایی',Closed:'بسته‌شده'};
export const REVIEW:Record<ReviewAction,string>={Observe:'ثبت مشاهده تکمیلی',DoctorReview:'تکمیل بررسی پزشک',BankReview:'تکمیل بررسی بانک خون',Investigate:'بررسی مسئول و تصمیم RCA',ReturnToDoctor:'بازگشت برای بررسی پزشک',PublishRca:'انتشار تحلیل RCA',Close:'بستن پرونده',External:'ثبت وضعیت گزارش بیرونی'};
export const SYMPTOMS:Record<string,string>={Fever:'تب',Chills:'لرز',Urticaria:'کهیر',Pruritus:'خارش',Dyspnea:'تنگی نفس',Hypotension:'افت فشار',Hypertension:'افزایش فشار',Tachycardia:'تاکی‌کاردی',Nausea:'تهوع',Vomiting:'استفراغ',ChestPain:'درد قفسه سینه',BackPain:'درد کمر',Hemoglobinuria:'هموگلوبینوری',Cyanosis:'سیانوز',Jaundice:'یرقان',Other:'سایر',Unknown:'نامشخص'};
export const DIAGNOSES:Record<string,string>={Undetermined:'تعیین نشده',FNHTR:'FNHTR — تب غیرهمولیتیک',Allergic:'آلرژیک',Anaphylaxis:'آنافیلاکسی',AHTR:'AHTR — همولیز حاد',DHTR:'DHTR — همولیز تأخیری',TACO:'TACO',TRALI:'TRALI',TAD:'TAD',Septic:'سپتیک',Hypotensive:'افت فشار',PTP:'PTP',TAGVHD:'TA-GVHD',Other:'سایر'};
export const SEVERITIES:Record<string,string>={Unknown:'نامشخص',Grade1:'درجه ۱',Grade2:'درجه ۲',Grade3:'درجه ۳',Grade4:'درجه ۴'};
export const IMPUTABILITIES:Record<string,string>={Unknown:'نامشخص',Excluded:'ردشده',Unlikely:'بعید',Possible:'ممکن',Probable:'محتمل',Certain:'قطعی (ثبت متخصص)'};
export const OUTCOMES:Record<string,string>={Unknown:'نامشخص',Recovered:'بهبود یافته',Recovering:'در حال بهبود',Ongoing:'ادامه‌دار',Sequelae:'عارضه باقی‌مانده',Death:'فوت ثبت‌شده',Other:'سایر'};
export const EXTERNAL:Record<string,string>={NotRecorded:'تعیین نشده',NotRequired:'عدم نیاز مستند',Required:'نیازمند گزارش',SentManually:'ارسال خارج سامانه ثبت شده'};
export const METHODS:Record<string,string>={FiveWhys:'پنج چرا',Fishbone:'نمودار استخوان ماهی',Timeline:'تحلیل زمان‌بندی',Other:'سایر'};
export const CAPA_STATUS:Record<string,string>={Open:'باز',InProgress:'در حال اجرا',Submitted:'در انتظار تأیید مستقل',Verified:'تأیید شده',Rejected:'نیازمند اصلاح'};
export const CAPA_KINDS:Record<string,string>={Corrective:'اصلاحی',Preventive:'پیشگیرانه'};
export interface HvCapabilities{list:boolean;detail:boolean;stats:boolean;candidates:boolean;report:boolean;observe:boolean;doctorReview:boolean;bankReview:boolean;investigate:boolean;returnToDoctor:boolean;publishRca:boolean;assignCapa:boolean;owners:boolean;capaProgress:boolean;capaVerify:boolean;close:boolean;external:boolean;reports:boolean;reportDetail?:boolean;archive:boolean;reportExternal:boolean;userGuid:string}
export type HvCapability=Exclude<keyof HvCapabilities,'userGuid'>;
export interface CaseRow{guid:string;caseNumber:string;transferGuid:string;transferNumber:string;patientName:string;hisNumber:string;ward:string;productCode:string;unitCode:string;status:HvStatus;onsetAt:string;reportedAt:string;initialSeverity:string;diagnosisCode:string|null;severity:string|null;imputability:string|null;outcome:string|null;demo:boolean;version:string}
export interface HvEvent{action:string;previousStatus:string;newStatus:string;occurredAt:string;actorUserGuid:string;actorRoleGuid:string;notes:string|null;evidenceJson:string|null}
export interface CapaView{guid:string;title:string;kind:string;ownerUserGuid:string;ownerName:string;dueAt:string;indicator:string;status:string;progress:number;evidence:string|null;submittedAt:string|null;submittedBy:string|null;verifiedAt:string|null;verifiedBy:string|null;verificationNotes:string|null;version:string}
export interface HvDetail{case:CaseRow;bloodGroup:string;transferStatus:string;startedAt:string|null;endedAt:string|null;suspectedReaction:boolean;symptoms:string[];initialNotes:string;actionsTaken:string;samplesSent:string|null;volumeMl:number|null;reporterUserGuid:string;doctorUserGuid:string|null;doctorReviewedAt:string|null;doctorNotes:string|null;doctorActions:string|null;doctorLabRequest:string|null;futureRecommendations:string|null;doctorReference:string|null;bankUserGuid:string|null;bankReviewedAt:string|null;bankFindings:string|null;bankSampleReference:string|null;bankReportReference:string|null;bankDisposition:string|null;investigationNotes:string|null;externalStatus:string;externalReference:string|null;rcaRequired:boolean|null;rcaLead:string|null;rcaMethod:string|null;rcaMeetingAt:string|null;rcaParticipants:string|null;directCause:string|null;rootCause:string|null;rcaPublishedAt:string|null;closedAt:string|null;events:HvEvent[];actions:CapaView[];vitals:VitalView[]}
export interface Candidate{guid:string;transferNumber:string;patientName:string;hisNumber:string;ward:string;productCode:string;unitCode:string;status:string;startedAt:string|null;endedAt:string|null;suspectedReaction:boolean;version:string}
export interface Owner{userGuid:string;name:string}
export interface Filters{search?:string;status?:string;ward?:string;productCode?:string;severity?:string;transferGuid?:string;from?:string;to?:string;pageNumber?:number;pageSize?:number;mineCapa?:boolean}
export interface Count{key:string;count:number}
export interface Summary{total:number;open:number;closed:number;pendingDoctor:number;pendingBank:number;rcaOpen:number;capaMonitoring:number;capaOpen:number;capaOverdue:number;externalPending:number;startedTransfers:number;byDiagnosis:Count[];bySeverity:Count[];byWard:Count[];byProduct:Count[];byStatus:Count[]}
export interface ReportInput{title:string;from:string;to:string;ward?:string;productCode?:string}
export interface ReportRow{guid:string;reportNumber:string;title:string;fromAt:string;toAt:string;ward:string|null;productCode:string|null;preparedAt:string;preparedBy:string;externalStatus:string;externalReference:string|null;version:string}
export interface ReportDetail{report:ReportRow;summary:Summary}
export interface ReactionInput{transferGuid:string;transferVersion:string;clientReportId:string;onsetAt:string;symptoms:string[];initialSeverity:string;notes:string;actionsTaken:string;samplesSent:string|null;volumeMl:number|null}
export interface ReviewInput{guid:string;version:string;notes:string;diagnosisCode?:string;severity?:string;imputability?:string;outcome?:string;actions?:string;labRequest?:string;recommendations?:string;doctorReference?:string;sampleReference?:string;reportReference?:string;disposition?:string;rcaRequired?:boolean|null;externalStatus?:string;externalReference?:string;rcaLead?:string;rcaMethod?:string;meetingAt?:string|null;participants?:string;directCause?:string;rootCause?:string}
export interface CapaCreateInput{guid:string;version:string;title:string;kind:string;ownerUserGuid:string;dueAt:string;indicator:string}
export interface CapaActionInput{guid:string;version:string;caseVersion:string;progress:number;evidence:string}
export function reviewActions(d:HvDetail,c:HvCapabilities|null):ReviewAction[]{
 if(!c||d.case.status==='Closed')return [];const s=d.case.status,out:ReviewAction[]=[];
 if(c.observe)out.push('Observe');if(c.doctorReview&&s==='Reported')out.push('DoctorReview');if(c.bankReview&&s==='DoctorReviewed')out.push('BankReview');
 if(c.investigate&&s==='BankReviewed')out.push('Investigate');
 if(c.returnToDoctor&&['DoctorReviewed','BankReviewed','RcaOpen','ReadyToClose'].includes(s)&&!d.actions.length)out.push('ReturnToDoctor');
 if(c.publishRca&&s==='RcaOpen')out.push('PublishRca');
 if(c.external)out.push('External');
 if(c.close&&['ReadyToClose','CapaMonitoring'].includes(s))out.push('Close');return out;
}
export function capaActions(d:HvDetail,c:CapaView,cap:HvCapabilities|null):CapaAction[]{
 if(!cap||d.case.status!=='CapaMonitoring')return [];
 if(cap.capaProgress&&c.ownerUserGuid===cap.userGuid&&['Open','InProgress','Rejected'].includes(c.status))return ['CapaProgress'];
 if(cap.capaVerify&&c.status==='Submitted'&&c.ownerUserGuid!==cap.userGuid&&c.submittedBy&&c.submittedBy!==cap.userGuid)return ['CapaVerify','CapaReject'];return [];
}
export function closeReady(d:HvDetail){return d.transferStatus!=='InProgress'&&(d.externalStatus==='NotRequired'||d.externalStatus==='SentManually'&&!!d.externalReference)&&(d.case.status==='ReadyToClose'&&d.rcaRequired===false||d.case.status==='CapaMonitoring'&&d.rcaRequired===true&&!!d.rcaPublishedAt&&d.actions.length>0&&d.actions.every(a=>a.status==='Verified'));}
export const statusColor=(s:string)=>s==='Closed'||s==='Verified'?'Verified':s==='Rejected'?'Mismatch':'Pending';
export const demo=(his:string)=>his.startsWith('DEMO-ST05-')||his.startsWith('DEMO-ST06-');
