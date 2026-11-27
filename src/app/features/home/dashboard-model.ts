export interface DashboardLink {label:string;path:string;query?:Record<string,string>}
export interface Metric {label:string;value:number;alert?:boolean;link?:DashboardLink}
export interface DashboardSection {id:string;title:string;description:string;metrics:Metric[];links:DashboardLink[];error?:string}
export interface Trend {label:string;current:number;previous:number}
export function metric(label:string,value:number,link?:DashboardLink,alert=false):Metric {
 return {label,value,link,alert};
}
export function link(label:string,path:string,query?:Record<string,string>):DashboardLink{return {label,path,query};}
export function bar(value:number,other:number):number{return Math.max(0,value)/Math.max(1,value,other)*100;}
export function fullWeeks(now:Date){
 const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 const day=86400000;
 const range=(offset:number)=>{const from=new Date(end.getTime()-(offset+7)*day),to=new Date(end.getTime()-offset*day-1);return {from:from.toISOString(),to:to.toISOString(),fromDate:from.toISOString().slice(0,10),toDate:to.toISOString().slice(0,10)};};
 return {current:range(0),previous:range(7)};
}
// A rejected API is unavailable, never a zero count. Keep other sections usable.
export async function loadSection(id:string,title:string,description:string,links:DashboardLink[],read:()=>Promise<Metric[]>):Promise<DashboardSection>{
 try{return {id,title,description,links,metrics:await read()};}
 catch{return {id,title,description,links,metrics:[],error:'دریافت آمار این بخش ممکن نشد؛ دوباره تلاش کنید.'};}
}
