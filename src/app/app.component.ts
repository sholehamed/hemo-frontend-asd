import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/auth/auth.service';
import { RequestStateComponent } from './shared/components/request-state.component';
@Component({selector:'app-root',standalone:true,imports:[RouterOutlet,RouterLink,RouterLinkActive,MatButtonModule,RequestStateComponent],templateUrl:'./app.component.html',styleUrl:'./app.component.css'})
export class AppComponent implements OnInit{
  readonly auth=inject(AuthService);private router=inject(Router);readonly drawer=signal(false);
  readonly nav=[{label:'داشبورد پذیرش',path:'/admission',icon:'▦',exact:true},{label:'پذیرش بیمار جدید',path:'/admission/new',icon:'＋',exact:false},{label:'فهرست بیماران بستری',path:'/admission/list',icon:'☷',exact:false},{label:'تطبیق هویت و مچ‌بند',path:'/admission/identity',icon:'✓',exact:false},{label:'سوابق انتقال خون',path:'/admission/history',icon:'◷',exact:false},{label:'کنترل ترخیص',path:'/admission/discharge',icon:'⇥',exact:false},{label:'همگام‌سازی HIS',path:'/admission/his',icon:'↔',exact:false},{label:'گزارش‌های پذیرش',path:'/admission/stats',icon:'▥',exact:false}];
  ngOnInit(){if(this.auth.loggedIn())void this.auth.refreshContext();}
  roleChange(event:Event){this.auth.selectRole(Number((event.target as HTMLSelectElement).value));}
  async logout(){await this.auth.logout();void this.router.navigateByUrl('/login');}
}
