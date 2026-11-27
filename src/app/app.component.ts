import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HvCapability } from './features/hemovigilance/hv-model';
import { CapabilityKey } from './features/transfusion/transfer-model';
import { BankCapabilities } from './features/blood-bank/bank-model';
import { AuthService } from './core/auth/auth.service';
import { RequestStateComponent } from './shared/components/request-state.component';
@Component({selector:'app-root',standalone:true,imports:[RouterOutlet,RouterLink,RouterLinkActive,MatButtonModule,RequestStateComponent],templateUrl:'./app.component.html',styleUrl:'./app.component.css'})
export class AppComponent implements OnInit{
  readonly auth=inject(AuthService);private router=inject(Router);readonly drawer=signal(false);
  readonly nav=[{label:'داشبورد پذیرش',path:'/admission',icon:'▦',exact:true},{label:'پذیرش بیمار جدید',path:'/admission/new',icon:'＋',exact:false},{label:'فهرست بیماران بستری',path:'/admission/list',icon:'☷',exact:false},{label:'تطبیق هویت و مچ‌بند',path:'/admission/identity',icon:'✓',exact:false},{label:'سوابق انتقال خون',path:'/admission/history',icon:'◷',exact:false},{label:'کنترل ترخیص',path:'/admission/discharge',icon:'⇥',exact:false},{label:'همگام‌سازی HIS',path:'/admission/his',icon:'↔',exact:false},{label:'گزارش‌های پذیرش',path:'/admission/stats',icon:'▥',exact:false}];
  readonly requestNav=[{label:'درخواست‌های خون',path:'/hemo/requests',icon:'☷'},{label:'ثبت درخواست پرستاری',path:'/hemo/requests/new',icon:'＋'},{label:'ثبت دستور پزشک',path:'/hemo/requests/orders',icon:'＋'},{label:'کارتابل تأیید پزشک',path:'/hemo/requests/approval',icon:'✓'},{label:'صف بانک خون',path:'/hemo/requests/bank',icon:'▦'}];
  readonly bankNav:{label:string;path:string;icon:string;cap:keyof BankCapabilities}[]=[
    {label:'داشبورد بانک خون',path:'/hemo/bank',icon:'▦',cap:'stats'},{label:'مدیریت موجودی',path:'/hemo/bank/inventory',icon:'☷',cap:'inventory'},
    {label:'دریافت فرآورده',path:'/hemo/bank/receive',icon:'＋',cap:'receive'},{label:'آزمایش و Crossmatch',path:'/hemo/bank/crossmatch',icon:'✓',cap:'inventory'},
    {label:'تاریخچه آزمایش‌ها',path:'/hemo/bank/lab-history',icon:'◷',cap:'labHistory'},
    {label:'ذوب فرآورده‌ها',path:'/hemo/bank/thaw',icon:'◷',cap:'inventory'},{label:'پایش دمای تجهیزات',path:'/hemo/bank/temperature',icon:'↔',cap:'temperatureHistory'},
    {label:'گزارش‌های بانک خون',path:'/hemo/bank/reports',icon:'▥',cap:'stats'}
  ];
  readonly transferNav:{label:string;path:string;icon:string;cap:CapabilityKey}[]=[
    {label:'داشبورد تحویل و تزریق',path:'/hemo/transfusion',icon:'▦',cap:'stats'},
    {label:'صدور و ارسال به بخش',path:'/hemo/transfusion/dispatch',icon:'⇥',cap:'candidates'},
    {label:'کارتابل تحویل و تزریق',path:'/hemo/transfusion/tasks',icon:'☷',cap:'list'},
    {label:'پایش علائم حیاتی',path:'/hemo/transfusion/vitals',icon:'♡',cap:'vital'},
    {label:'پایش پزشک',path:'/hemo/transfusion/monitoring',icon:'✓',cap:'doctorNote'},
    {label:'مرجوعی فرآورده',path:'/hemo/transfusion/returns',icon:'↶',cap:'list'},
    {label:'پرونده و گزارش تزریق',path:'/hemo/transfusion/records',icon:'▥',cap:'list'}
  ];
  readonly hvNav:{label:string;path:string;icon:string;cap:HvCapability}[]=[
    {label:'داشبورد هموویژیلانس',path:'/hemo/hv',icon:'▦',cap:'stats'},
    {label:'گزارش واکنش جدید',path:'/hemo/hv/new',icon:'＋',cap:'report'},
    {label:'پرونده واکنش‌ها',path:'/hemo/hv/cases',icon:'☷',cap:'list'},
    {label:'بررسی پزشک',path:'/hemo/hv/doctor',icon:'✓',cap:'doctorReview'},
    {label:'بررسی بانک خون',path:'/hemo/hv/bank',icon:'✓',cap:'bankReview'},
    {label:'تحلیل ریشه‌ای RCA',path:'/hemo/hv/rca',icon:'◉',cap:'investigate'},
    {label:'پیگیری اقدامات CAPA',path:'/hemo/hv/capa',icon:'↔',cap:'list'},
    {label:'گزارش و آرشیو',path:'/hemo/hv/reports',icon:'▥',cap:'reports'}
  ];
  readonly qualityNav=[
    {label:'داشبورد تجهیزات',path:'/hemo/quality/equipment-dashboard',icon:'▦',cap:'equipmentStats'},
    {label:'شناسنامه تجهیزات',path:'/hemo/quality/equipment',icon:'☷',cap:'equipmentList'},
    {label:'سرویس و کالیبراسیون',path:'/hemo/quality/maintenance',icon:'◷',cap:'equipmentList'},
    {label:'پایش دما و زنجیره سرما',path:'/hemo/quality/temperature',icon:'↔',cap:'equipmentList'},
    {label:'حوادث تجهیزات',path:'/hemo/quality/incidents',icon:'!',cap:'incidents'},
    {label:'کنترل کیفیت روزانه',path:'/hemo/quality/qc',icon:'✓',cap:'qcList'},
    {label:'کمیته و مصوبات',path:'/hemo/quality/committee',icon:'☷',cap:'committeeList'},
    {label:'ممیزی و بازرسی',path:'/hemo/quality/audit',icon:'✓',cap:'auditList'},
    {label:'دوره‌ها و آموزش',path:'/hemo/quality/training',icon:'▦',cap:'trainingList'},
    {label:'اطلاعات پایه مرکز',path:'/hemo/quality/settings',icon:'⚙',cap:'facility'},
    {label:'گزارش مدیریتی کیفیت',path:'/hemo/quality',icon:'▥',cap:'stats'}
  ];
  visible(path:string){
    if(path==='/admission')return this.auth.can('stats')&&this.auth.can('list');
    if(path==='/admission/new')return this.auth.can('create');
    if(path==='/admission/list')return this.auth.can('list');
    if(path==='/admission/stats')return this.auth.can('stats');
    if(path==='/admission/his')return this.auth.can('list')&&this.auth.can('stats');
    if(path==='/admission/history')return this.auth.can('history')&&this.auth.can('reviews')&&this.auth.can('detail');
    return this.auth.can('reviews')&&this.auth.can('detail')&&this.auth.can('list');
  }
  requestVisible(path:string){switch(path){case '/hemo/requests':return this.auth.requestCan('list');case '/hemo/requests/new':return this.auth.requestCan('nurseCreate');case '/hemo/requests/orders':return this.auth.requestCan('doctorCreate');case '/hemo/requests/approval':return this.auth.requestCan('decide')&&this.auth.requestCan('list');default:return this.auth.requestCan('bankQueue');}}
  home(){return this.auth.homePath();}
  ngOnInit(){if(this.auth.loggedIn())void this.auth.refreshContext();}
  roleChange(event:Event){this.auth.selectRole(Number((event.target as HTMLSelectElement).value));}
  async logout(){await this.auth.logout();void this.router.navigateByUrl('/login');}
}
