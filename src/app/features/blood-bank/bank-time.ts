import { jalaliToIso,isoToJalali,normalizeDigits } from '../../shared/jalali-date';
// Backend stores UTC DateTime; SQL Server may return an ISO string without Z.
function instant(value:string){return new Date(/(?:Z|[+-]\d\d:\d\d)$/i.test(value)?value:value+'Z');}
function parts(date:Date){const pad=(n:number)=>String(n).padStart(2,'0');return {day:date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate()),time:pad(date.getHours())+':'+pad(date.getMinutes())};}
export function localFields(value?:string|null){const d=value?instant(value):new Date();if(!Number.isFinite(d.getTime()))return {date:'',time:''};const p=parts(d);return {date:isoToJalali(p.day),time:p.time};}
export function bankDateTime(value?:string|null){if(!value)return '—';const p=localFields(value);return p.date+' '+p.time;}
export function toUtc(date:string,time:string){const iso=jalaliToIso(date),t=normalizeDigits(time.trim());if(!iso||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t))throw new Error('تاریخ شمسی و ساعت معتبر لازم است.');const d=new Date(iso+'T'+t+':00');if(!Number.isFinite(d.getTime())||parts(d).day!==iso||parts(d).time!==t)throw new Error('زمان محلی معتبر نیست.');return d.toISOString();}
