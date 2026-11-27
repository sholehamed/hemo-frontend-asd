import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { SubmitButtonComponent } from './submit-button.component';

@Component({
  standalone: true,
  imports: [FormsModule, SubmitButtonComponent],
  template: '<form><app-submit-button></app-submit-button></form>'
})
class HostComponent {}

describe('SubmitButtonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: SubmitButtonComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SubmitButtonComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
