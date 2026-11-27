import {jalaliToIso,normalizeDigits} from '../../shared/jalali-date';
import {localFields} from '../blood-bank/bank-time';
export function measuredFields(){const now=new Date(),p=localFields(now.toISOString());return {date:p.date,time:p.time+':'+String(now.getSeconds()).padStart(2,'0')};}
export function measuredUtc(date:string,time:string){
 const day=jalaliToIso(date),t=normalizeDigits(time.trim());
 if(!day||!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(t))throw new Error('تاریخ شمسی و ساعت با ثانیه معتبر لازم است.');
 const d=new Date(day+'T'+t);if(!Number.isFinite(d.getTime()))throw new Error('زمان محلی معتبر نیست.');
 const p=localFields(d.toISOString()),seconds=String(d.getSeconds()).padStart(2,'0');
 if(jalaliToIso(p.date)!==day||p.time+':'+seconds!==t)throw new Error('زمان محلی معتبر نیست.');
 return d.toISOString();
}
