import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { InputTimeComponent } from './input-time.component';

@Component({
  standalone: true,
  imports: [FormsModule, InputTimeComponent],
  template: '<form><app-input-time></app-input-time></form>'
})
class HostComponent {}

describe('InputTimeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: InputTimeComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(InputTimeComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
