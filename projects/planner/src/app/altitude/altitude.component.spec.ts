import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltitudeComponent } from './altitude.component';

describe('AltitudeComponent', () => {
  let component: AltitudeComponent;
  let fixture: ComponentFixture<AltitudeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AltitudeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AltitudeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
