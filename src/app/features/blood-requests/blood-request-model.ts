// ST-03 shared typed request contract.
export const REQUEST_PRODUCTS = [
  {code:'RBC',label:'گلبول قرمز متراکم'},
  {code:'WashedRBC',label:'گلبول قرمز شسته‌شده'},
  {code:'IrradiatedRBC',label:'گلبول قرمز اشعه‌دیده'},
  {code:'LeukoreducedRBC',label:'گلبول قرمز کم‌لوکوسیت'},
  {code:'Platelet',label:'پلاکت'},
  {code:'ApheresisPlatelet',label:'پلاکت فرزیس'},
  {code:'FFP',label:'پلاسمای تازه منجمد'},
  {code:'WholeBlood',label:'خون کامل'},
  {code:'Cryoprecipitate',label:'کرایوپرسیپیتیت'},
  {code:'Autologous',label:'خون اتولوگ'},
  {code:'WashedLRRBC',label:'گلبول شسته کم‌لوکوسیت'},
  {code:'IrradiatedLRRBC',label:'گلبول اشعه‌دیده کم‌لوکوسیت'},
  {code:'IrradiatedPlatelet',label:'پلاکت اشعه‌دیده'},
  {code:'IrradiatedApheresisPlatelet',label:'پلاکت فرزیس اشعه‌دیده'},
  {code:'PediatricRBC',label:'گلبول قرمز اطفال'},
  {code:'ReconstitutedWholeBlood',label:'خون کامل بازسازی‌شده'},
  {code:'CryoPoorPlasma',label:'پلاسمای فاقد کرایو'}
] as const;
export type ProductCode=typeof REQUEST_PRODUCTS[number]['code'];
export type RequestStatus='Draft'|'AwaitingDoctor'|'Returned'|'AwaitingBank'|'Rejected'|'Cancelled';
export type RequestForm='General'|'WashedRBC'|'Irradiated'|'Apheresis'|'Emergency'|'InterHospital'|'Autologous'|'RBC'|'Platelet'|'FFP';
export type RequestPriority='Routine'|'Urgent'|'Emergency';
export interface RequestLine {productCode:ProductCode;quantity:number;requestedBloodGroup:string|null;specialInstructions:string|null}
export const REQUEST_STATUS_LABEL:Record<RequestStatus,string>={
  Draft:'پیش‌نویس',AwaitingDoctor:'در انتظار تأیید پزشک',Returned:'برگشت برای اصلاح',
  AwaitingBank:'در انتظار بانک خون',Rejected:'رد شده',Cancelled:'لغو شده'
};
export function validRequestLines(lines:readonly RequestLine[]):boolean {
  return lines.length>0 && lines.every(x=>REQUEST_PRODUCTS.some(p=>p.code===x.productCode)&&Number.isSafeInteger(x.quantity)&&x.quantity>0&&x.quantity<=10000)
    && new Set(lines.map(x=>x.productCode)).size===lines.length;
}
export function canEditRequest(status:RequestStatus):boolean{return status==='Draft'||status==='Returned';}

export const REQUEST_FORMS: {code:RequestForm;label:string;description:string;source:'Both'|'Nurse'|'Doctor';product?:ProductCode}[]=[
 {code:'General',label:'درخواست عمومی (HV.006)',description:'انتخاب یک یا چند فرآورده',source:'Both'},
 {code:'RBC',label:'گلبول قرمز',description:'Hb، Hct و علت بالینی',source:'Nurse',product:'RBC'},
 {code:'WashedRBC',label:'گلبول شسته (HV.011)',description:'علت اختصاصی و سابقه واکنش',source:'Both',product:'WashedRBC'},
 {code:'Irradiated',label:'اشعه‌دیده (HV.008)',description:'علت اختصاصی فرآورده اشعه‌دیده',source:'Both',product:'IrradiatedRBC'},
 {code:'Platelet',label:'پلاکت',description:'شمارش پلاکت و خونریزی',source:'Nurse',product:'Platelet'},
 {code:'Apheresis',label:'پلاکت فرزیس (HV.010)',description:'اطلاعات HLA/HPA و سابقه',source:'Both',product:'ApheresisPlatelet'},
 {code:'FFP',label:'پلاسمای تازه FFP',description:'اطلاعات انعقادی',source:'Nurse',product:'FFP'},
 {code:'Emergency',label:'اورژانسی (HV.007)',description:'علت و اطلاعات نمونه؛ بدون تأیید خودکار',source:'Both'},
 {code:'InterHospital',label:'انتقال بین‌بیمارستانی',description:'مبدأ، مقصد و وضعیت حمل گزارش‌شده',source:'Nurse'},
 {code:'Autologous',label:'اتولوگ (PAD)',description:'اطلاعات عمل و رضایت مستند',source:'Doctor',product:'Autologous'}
];
export const PRIORITIES:Record<RequestPriority,string>={Routine:'عادی',Urgent:'فوری',Emergency:'اورژانسی'};
export interface SpecialFormData {specialReason?:string|null;reactionDescription?:string|null;premedicationRoute?:string|null;sampleCollector?:string|null;sampleAt?:string|null;neededAt?:string|null;surgery?:string|null;surgeryAt?:string|null;msboS?:string|null;administrationPlan?:string|null;pt?:number|null;ptt?:number|null;inr?:number|null;fibrinogen?:number|null;bleedingSite?:string|null;refractoriness?:string|null;hlaHpa?:string|null;donorReference?:string|null;originHospital?:string|null;destinationHospital?:string|null;transportTemperature?:number|null;transferMinutes?:number|null;coldChain?:string|null;donationIntervalDays?:number|null;ironTherapy?:string|null;consentDocumented?:boolean|null;safetyAssessment?:string|null;contact?:string|null;emergencyInstructions?:string|null;sampleTests?:string|null;physicianReference?:string|null}
export interface ClinicalInput {diagnosis:string|null;clinicalIndication:string|null;hemoglobin:number|null;hematocrit:number|null;plateletCount:number|null;recentTransfusion:boolean|null;recentPregnancy:boolean|null;priorReaction:boolean|null;unexpectedAntibody:boolean|null;premedication:string|null;sampleStatus:string|null;notes:string|null;formDetails:SpecialFormData}
export interface RequestInput {patientAdmissionGuid:string;clientRequestId:string;formType:RequestForm;priority:RequestPriority;items:RequestLine[];clinical:ClinicalInput}
export interface PhysicianCompletion {diagnosis:string;indication:string;medicalCouncilNumber:string;notes:string|null;confirmed:boolean}
export interface RequestRow {guid:string;requestNumber:string;patientAdmissionGuid:string;patientName:string;hisNumber:string;ward:string;source:'Nurse'|'Doctor';formType:RequestForm;priority:RequestPriority;status:RequestStatus;created:string;submittedAt:string|null;totalUnits:number;owned:boolean}
export interface ApprovalView {action:string;previousStatus:RequestStatus;newStatus:RequestStatus;reason:string|null;submissionAttempt:number;occurredAt:string;actorUserGuid:string;actorRoleGuid:string;physician:PhysicianCompletion|null}
export interface RequestDetail {request:RequestRow;clientRequestId:string;version:string;bloodGroup:string|null;identityStatus:string;bedNumber:string;items:RequestLine[];clinical:ClinicalInput;history:ApprovalView[];admissionChanged:boolean}
export interface RequestCapabilities {list:boolean;detail:boolean;stats:boolean;nurseCreate:boolean;doctorCreate:boolean;edit:boolean;submit:boolean;cancel:boolean;decide:boolean;bankQueue:boolean;bankDetail:boolean}
export interface RequestPage {data:RequestRow[];pageNumber:number;totalCount:number;totalPages:number;hasPreviousPage:boolean;hasNextPage:boolean}
export interface RequestStats {total:number;draft:number;awaitingDoctor:number;returned:number;awaitingBank:number;rejected:number;cancelled:number}
export interface RequestFilters {search?:string;status?:string;priority?:string;ward?:string;patientAdmissionGuid?:string;mine?:boolean;pageNumber?:number;pageSize?:number}
export interface DecisionInput {guid:string;version:string;action:'Submit'|'Cancel'|'Approve'|'Return'|'Reject';reason?:string|null;physician?:PhysicianCompletion}
export function blankClinical():ClinicalInput{return {diagnosis:null,clinicalIndication:null,hemoglobin:null,hematocrit:null,plateletCount:null,recentTransfusion:null,recentPregnancy:null,priorReaction:null,unexpectedAntibody:null,premedication:null,sampleStatus:'Unknown',notes:null,formDetails:{}};}
export function submissionIssue(input:RequestInput):string|null{
 if(!input.patientAdmissionGuid)return 'پرونده بیمار را انتخاب کنید.';
 if(!validRequestLines(input.items)||!input.clinical.clinicalIndication?.trim())return 'اقلام و علت بالینی درخواست را تکمیل کنید.';
 const d=input.clinical.formDetails;
 if(['WashedRBC','Irradiated','Apheresis','Emergency','Autologous'].includes(input.formType)&&!d.specialReason?.trim())return 'علت اختصاصی فرم را ثبت کنید.';
 if(input.formType==='Emergency'&&input.priority!=='Emergency')return 'اولویت فرم اورژانسی باید اورژانس باشد.';
 if(input.formType==='InterHospital'&&(!d.originHospital?.trim()||!d.destinationHospital?.trim()))return 'مبدأ و مقصد انتقال را ثبت کنید.';
 if(input.formType==='Autologous'&&(!d.consentDocumented||!d.surgeryAt||!d.surgery?.trim()))return 'اطلاعات عمل و رضایت مستند را وارد کنید.';
 return null;
}
export const productLabel=(code:string)=>REQUEST_PRODUCTS.find(x=>x.code===code)?.label??code;
export const formLabel=(code:string)=>REQUEST_FORMS.find(x=>x.code===code)?.label??code;
export const SPECIAL_LABELS:Record<string,string>={specialReason:'علت اختصاصی',reactionDescription:'شرح واکنش قبلی',premedicationRoute:'نحوه تجویز',sampleCollector:'نمونه‌گیر',sampleAt:'زمان نمونه‌گیری',neededAt:'زمان نیاز',surgery:'نوع عمل',surgeryAt:'تاریخ عمل',msboS:'MSBOS',administrationPlan:'برنامه تجویز ثبت‌شده',pt:'PT',ptt:'PTT',inr:'INR',fibrinogen:'فیبرینوژن',bleedingSite:'محل خونریزی',refractoriness:'Refractoriness',hlaHpa:'HLA/HPA',donorReference:'مرجع اهداکنندگان',originHospital:'مبدأ',destinationHospital:'مقصد',transportTemperature:'دمای حمل گزارش‌شده',transferMinutes:'مدت انتقال (دقیقه)',coldChain:'وضعیت زنجیره سرد',donationIntervalDays:'فاصله نوبت‌ها (روز)',ironTherapy:'مکمل آهن',consentDocumented:'رضایت مستند',safetyAssessment:'ارزیابی مستند ایمنی',contact:'تماس',emergencyInstructions:'شرح نیاز اورژانسی',sampleTests:'آزمایش‌های درخواست‌شده',physicianReference:'پزشک درخواست‌کننده'};
