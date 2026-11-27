import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { ShareCaptchaComponent } from './share-captcha.component';

@Component({
  standalone: true,
  imports: [FormsModule, ShareCaptchaComponent],
  template: '<form><app-share-captcha></app-share-captcha></form>'
})
class HostComponent {}

describe('ShareCaptchaComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: ShareCaptchaComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(ShareCaptchaComponent)).componentInstance;
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.method === 'GET' && r.url.includes('/captchaendpoint?get=html&c=NftCaptchaStyle'));
    request.flush('<input id="BDC_VCID_NftCaptchaStyle" value="fixture-captcha">');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
