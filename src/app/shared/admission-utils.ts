export const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const;
export const LABELS:Record<string,string>={NationalId:'کد ملی',Passport:'گذرنامه / شناسه اتباع',Unknown:'نامشخص',Female:'زن',Male:'مرد',Inpatient:'بستری',Emergency:'اورژانس',Outpatient:'سرپایی',None:'بدون سابقه',Previous:'سابقه تزریق بدون عارضه',Reaction:'سابقه واکنش نامطلوب',Pending:'در انتظار تطبیق',Verified:'تطبیق تأیید شده',Mismatch:'عدم انطباق',Active:'بستری فعال',ReadyForDischarge:'آماده بررسی ترخیص',IdentityUpdate:'اصلاح هویت',Resolved:'هویت تعیین شد',Updated:'مشخصات اصلاح شد',Identity:'تطبیق هویت',History:'بررسی سوابق',Clearance:'کنترل ترخیص',Reviewed:'بررسی ثبت شد',Draft:'پیش‌نویس',Ready:'آماده بررسی ترخیص'};
export const label=(v:string|null|undefined)=>v?LABELS[v]??v:'ثبت نشده';
export const fa=(n:number)=>new Intl.NumberFormat('fa-IR').format(n);
export function maskFor(values:readonly boolean[]){return values.reduce((m,v,i)=>m|(v?1<<i:0),0);}
export function flagsFor(mask:number){return Array.from({length:5},(_,i)=>(mask&(1<<i))!==0);}
export function isNationalId(value:string):boolean {
 const s=value.replace(/[۰-۹]/g,v=>String(v.charCodeAt(0)-1776)).replace(/[٠-٩]/g,v=>String(v.charCodeAt(0)-1632)).replace(/\s/g,'');
 if(!/^\d{10}$/.test(s)||/^([0-9])\1{9}$/.test(s))return false;
 const rem=[...s.slice(0,9)].reduce((sum,c,i)=>sum+Number(c)*(10-i),0)%11;
 return Number(s[9])===(rem<2?rem:11-rem);
}
export function csvCell(value:unknown):string{
 let s=value==null?'':String(value);
 if(/^\s*[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
}
export function csvContent(rows:readonly (readonly unknown[])[]){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function downloadCsv(name:string,rows:readonly (readonly unknown[])[]){
 const url=URL.createObjectURL(new Blob([csvContent(rows)],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function message(error:unknown){return (error as {message?:string}|null)?.message??'عملیات انجام نشد؛ مجدداً تلاش کنید.';}
export function percentage(part:number,total:number){return total?Math.round(100*part/total):0;}
