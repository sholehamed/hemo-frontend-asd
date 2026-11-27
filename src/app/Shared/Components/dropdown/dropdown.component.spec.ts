import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { DropdownComponent } from './dropdown.component';

@Component({
  standalone: true,
  imports: [FormsModule, DropdownComponent],
  template: '<form><app-dropdown></app-dropdown></form>'
})
class HostComponent {}

describe('DropdownComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: DropdownComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(DropdownComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.query(By.css('p-dropdown'))).not.toBeNull();
  });
  it('emits the configured identifier and selected object', () => {
    const option = { guid: 'fixture-option', name: 'گزینه آزمون' };
    spyOn(component.DataValueChange, 'emit');
    spyOn(component.DataChange, 'emit');
    component.ngModelChange(option);
    expect(component.DataValueChange.emit).toHaveBeenCalledWith(option.guid);
    expect(component.DataChange.emit).toHaveBeenCalledWith(option);
  });
});
