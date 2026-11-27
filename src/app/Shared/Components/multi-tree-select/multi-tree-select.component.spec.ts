import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../testing/company-test-providers';
import { MultiTreeSelectComponent } from './multi-tree-select.component';

@Component({
  standalone: true,
  imports: [FormsModule, MultiTreeSelectComponent],
  template: '<form><app-multi-tree-select Name="fixtureTree"></app-multi-tree-select></form>'
})
class HostComponent {}

describe('MultiTreeSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: MultiTreeSelectComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: companyTestProviders()
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(MultiTreeSelectComponent)).componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.query(By.css('p-treeSelect'))).not.toBeNull();
  });
  it('emits identifiers for multiple selected nodes', () => {
    const nodes = [{ GUID: 'a', Name: 'اول' }, { GUID: 'b', Name: 'دوم' }];
    spyOn(component.DataValueChange, 'emit');
    spyOn(component.DataChange, 'emit');
    component.ngModelChange(nodes);
    expect(component.DataValueChange.emit).toHaveBeenCalledWith(['a', 'b']);
    expect(component.DataChange.emit).toHaveBeenCalledWith(nodes);
  });
});
