import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { SingleFileUploadComponent } from './single-file-upload.component';

@Component({
  standalone: true,
  imports: [FormsModule, SingleFileUploadComponent],
  template: '<form><app-single-file-upload></app-single-file-upload></form>'
})
class HostComponent {}

describe('SingleFileUploadComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: SingleFileUploadComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SingleFileUploadComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
