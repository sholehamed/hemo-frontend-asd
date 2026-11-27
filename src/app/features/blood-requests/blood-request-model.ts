// ST03-01 contract foundation. Not connected to a production endpoint or route yet.
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
  {code:'Autologous',label:'خون اتولوگ'}
] as const;
export type ProductCode=typeof REQUEST_PRODUCTS[number]['code'];
export type RequestStatus='Draft'|'AwaitingDoctor'|'Returned'|'AwaitingBank'|'Rejected'|'Cancelled';
export type RequestForm='General'|'WashedRBC'|'Irradiated'|'Apheresis'|'Emergency'|'InterHospital'|'Autologous';
export type RequestPriority='Routine'|'Urgent'|'Emergency';
export interface RequestLine {productCode:ProductCode;quantity:number;requestedBloodGroup:string|null;specialInstructions:string|null}
export const REQUEST_STATUS_LABEL:Record<RequestStatus,string>={
  Draft:'پیش‌نویس',AwaitingDoctor:'در انتظار تأیید پزشک',Returned:'برگشت برای اصلاح',
  AwaitingBank:'در انتظار بانک خون',Rejected:'رد شده',Cancelled:'لغو شده'
};
export function validRequestLines(lines:readonly RequestLine[]):boolean {
  return lines.length>0 && lines.every(x=>REQUEST_PRODUCTS.some(p=>p.code===x.productCode)&&Number.isSafeInteger(x.quantity)&&x.quantity>0)
    && new Set(lines.map(x=>x.productCode)).size===lines.length;
}
export function canEditRequest(status:RequestStatus):boolean{return status==='Draft'||status==='Returned';}
