import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalinityComponent } from './salinity.component';

describe('SalinityComponent', () => {
  let component: SalinityComponent;
  let fixture: ComponentFixture<SalinityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalinityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SalinityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
