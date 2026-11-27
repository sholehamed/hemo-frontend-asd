import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { DateInputComponent } from './date-input.component';

@Component({
  standalone: true,
  imports: [FormsModule, DateInputComponent],
  template: '<form><app-date-input></app-date-input></form>'
})
class HostComponent {}

describe('DateInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: DateInputComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(DateInputComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
