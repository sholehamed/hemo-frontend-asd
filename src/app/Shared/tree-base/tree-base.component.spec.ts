import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeBaseComponent } from './tree-base.component';

describe('TreeBaseComponent', () => {
  let component: TreeBaseComponent;
  let fixture: ComponentFixture<TreeBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeBaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
