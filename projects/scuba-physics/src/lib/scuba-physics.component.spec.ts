import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScubaPhysicsComponent } from './scuba-physics.component';

describe('ScubaPhysicsComponent', () => {
  let component: ScubaPhysicsComponent;
  let fixture: ComponentFixture<ScubaPhysicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScubaPhysicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScubaPhysicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
