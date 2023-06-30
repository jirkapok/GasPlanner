import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TankSizeComponent } from './tank.size.component';

describe('TankSizeComponent', () => {
  let component: TankSizeComponent;
  let fixture: ComponentFixture<TankSizeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TankSizeComponent]
    });
    fixture = TestBed.createComponent(TankSizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
