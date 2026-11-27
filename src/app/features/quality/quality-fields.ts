import {QualityKind,SHIFTS,RESULTS,ATTENDANCE} from './quality-model';
import {localFields,toUtc} from '../blood-bank/bank-time';
export interface Field{key:string;label:string;type?:'textarea'|'select'|'number'|'date';required?:boolean;max?:number;min?:number;step?:string;options?:[string,string][]}
const select=(key:string,label:string,options:Record<string,string>):Field=>({key,label,type:'select',required:true,options:Object.entries(options)});
const text=(key:string,label:string,max=200,required=true):Field=>({key,label,max,required});
const area=(key:string,label:string,max=4000,required=true):Field=>({key,label,type:'textarea',max,required});
export const HEADERS:Record<QualityKind,Field[]>={
 Qc:[select('shift','شیفت کاری',SHIFTS),text('operator','نام کارشناس ثبت‌کننده'),{key:'waterBathTemperature',label:'دمای ثبت‌شده بن‌ماری (°C)',type:'number',step:'0.01'},area('nonconformance','شرح عدم انطباق',4000,false),area('correctiveAction','اقدام اصلاحی واقعاً انجام‌شده',4000,false)],
 Committee:[text('chair','رئیس جلسه'),text('secretary','دبیر جلسه'),area('participants','اعضای حاضر'),area('agenda','دستور جلسه و خلاصه مذاکرات')],
 Audit:[text('checklist','عنوان / مرجع چک‌لیست'),text('auditor','نام ممیز / ارزیاب')],
 Training:[text('instructor','مدرس'),{key:'durationMinutes',label:'مدت (دقیقه)',type:'number',min:1,max:10080,step:'1',required:true},{key:'capacity',label:'حداکثر ظرفیت',type:'number',min:1,max:10000,step:'1',required:true},text('audience','گروه هدف',500),text('materialReference','مرجع جزوه / SOP مصوب (اختیاری)',1000,false)]
};
export const LINES:Record<QualityKind,Field[]>={
 Qc:[text('lot','شماره لات',100),text('manufacturer','شرکت سازنده'),{key:'expiry',label:'انقضای معرف (شمسی)',type:'date',required:true},text('positiveExpected','انتظار کنترل مثبت'),text('positiveObserved','قرائت کنترل مثبت'),text('negativeExpected','انتظار کنترل منفی'),text('negativeObserved','قرائت کنترل منفی'),select('result','نتیجه ثبت‌شده',RESULTS),area('notes','ملاحظات / عدم انطباق',4000,false)],
 Committee:[area('indicator','شاخص اثربخشی',1000),area('notes','ملاحظات',4000,false)],
 Audit:[text('clause','بند / مرجع استاندارد'),select('score','امتیاز ثبت‌شده',{'0':'عدم انطباق (۰)','1':'نقص جزئی (۱)','2':'منطبق (۲)'}),area('notes','ملاحظات و شواهد',4000,false)],
 Training:[text('personnelCode','کد پرسنلی / حرفه‌ای',100),text('ward','بخش / سمت',120),select('shift','شیفت',SHIFTS),select('attendance','وضعیت حضور',ATTENDANCE),{key:'preScore',label:'پیش‌آزمون (۰ تا ۲۰)',type:'number',min:0,max:20,step:'1'},{key:'postScore',label:'پس‌آزمون (۰ تا ۲۰)',type:'number',min:0,max:20,step:'1'},text('certificateReference','مرجع گواهی حضور (اختیاری)',200,false),area('notes','ملاحظات',4000,false)]
};
export function blank(fields:Field[],existing:Record<string,any>={}):Record<string,any>{return Object.fromEntries(fields.map(f=>[f.key,f.type==='date'&&existing[f.key]?localFields(existing[f.key]).date:f.type==='number'?existing[f.key]??null:existing[f.key]==null?'':String(existing[f.key])]));}
export function payload(fields:Field[],values:Record<string,any>){const out:Record<string,any>={};for(const f of fields){let v=values[f.key];if(f.required&&(v===null||v===undefined||String(v).trim()===''))throw new Error('فیلد «'+f.label+'» الزامی است.');
 if(v===null||v===undefined||v===''){out[f.key]=null;continue;}
 if(f.type==='date')v=new Date(Date.parse(toUtc(v,'23:59'))+59999).toISOString();
 if(f.key==='score')v=Number(v);if(f.type==='number'&&!Number.isFinite(v))throw new Error('عدد معتبر وارد کنید.');
 out[f.key]=v;}return out;}
export function display(f:Field,v:unknown){if(v===null||v===undefined||v==='')return '—';if(f.type==='date')return localFields(String(v)).date;return f.options?.find(x=>x[0]===String(v))?.[1]??String(v);}
