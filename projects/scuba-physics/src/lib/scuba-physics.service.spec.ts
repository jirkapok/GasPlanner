import { TestBed } from '@angular/core/testing';

import { ScubaPhysicsService } from './scuba-physics.service';

describe('ScubaPhysicsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ScubaPhysicsService = TestBed.get(ScubaPhysicsService);
    expect(service).toBeTruthy();
  });
});
