import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AdmissionView } from '../../core/api/admissions.service';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { WristbandComponent } from './wristband.component';

describe('R02 real wristband SVG on company Angular19',()=>{
  let active:boolean;
  const patient=(guid:string,code:string):AdmissionView=>({
    guid,wristbandCode:code,firstName:'Fixture',lastName:'Patient',hisNumber:'TEST-01',
    identificationNumber:'TEST-ID',birthDate:'1990-01-01',allergy:false
  } as AdmissionView);
  beforeEach(()=>{
    active=true;
    TestBed.configureTestingModule({providers:[provideNoopAnimations(),{
      provide:HemoPageScope,useValue:{isCurrent:()=>active}
    }]});
  });
  it('renders the real CODE128 SVG with bars and allows print only for current input',()=>{
    const f=TestBed.createComponent(WristbandComponent);
    f.componentRef.setInput('patient',patient('id-a','HEMO-TEST-001'));
    f.detectChanges();f.detectChanges();
    const svg=f.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(5);
    expect(f.componentInstance.error()).toBeNull();
    expect(f.componentInstance.canPrint()).toBeTrue();
    const print=spyOn(window,'print');
    f.componentInstance.print();expect(print).toHaveBeenCalledTimes(1);
    f.componentRef.setInput('patient',patient('id-b','HEMO-TEST-002'));
    expect(f.componentInstance.canPrint()).toBeFalse();
    f.detectChanges();f.detectChanges();
    expect(f.componentInstance.canPrint()).toBeTrue();
    active=false;
    f.componentInstance.print();expect(print).toHaveBeenCalledTimes(1);
    f.destroy();
  });
  it('clears previous bars and refuses printing when a new patient has no barcode',()=>{
    const f=TestBed.createComponent(WristbandComponent);
    f.componentRef.setInput('patient',patient('id-a','HEMO-TEST-001'));
    f.detectChanges();f.detectChanges();
    expect(f.componentInstance.canPrint()).toBeTrue();
    f.componentRef.setInput('patient',patient('id-b',''));
    f.detectChanges();f.detectChanges();
    expect(f.nativeElement.querySelector('svg').querySelectorAll('rect').length).toBe(0);
    expect(f.componentInstance.error()).toContain('شناسه بارکد');
    expect(f.componentInstance.canPrint()).toBeFalse();
    const print=spyOn(window,'print');
    f.componentInstance.print();expect(print).not.toHaveBeenCalled();
    f.destroy();
  });
  it('rejects unsupported CODE128 content without retaining old bars',()=>{
    const f=TestBed.createComponent(WristbandComponent);
    f.componentRef.setInput('patient',patient('id-a','HEMO-TEST-001'));f.detectChanges();f.detectChanges();
    f.componentRef.setInput('patient',patient('id-b','شناسه-نامعتبر'));f.detectChanges();f.detectChanges();
    expect(f.componentInstance.error()).not.toBeNull();
    expect(f.componentInstance.canPrint()).toBeFalse();
    expect(f.nativeElement.querySelector('svg').querySelectorAll('rect').length).toBe(0);
    f.destroy();
  });
});
