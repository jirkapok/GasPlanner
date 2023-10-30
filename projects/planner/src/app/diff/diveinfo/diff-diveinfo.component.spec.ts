import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveinfoDifferenceComponent } from './diff-diveinfo.component';

describe('DiveinfoComponent', () => {
  let component: DiveinfoDifferenceComponent;
  let fixture: ComponentFixture<DiveinfoDifferenceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DiveinfoDifferenceComponent]
    });
    fixture = TestBed.createComponent(DiveinfoDifferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
