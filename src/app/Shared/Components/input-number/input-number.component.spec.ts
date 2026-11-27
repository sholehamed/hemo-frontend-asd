import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { InputNumberComponent } from './input-number.component';

@Component({
  standalone: true,
  imports: [FormsModule, InputNumberComponent],
  template: '<form><app-input-number></app-input-number></form>'
})
class HostComponent {}

describe('InputNumberComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: InputNumberComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(InputNumberComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
