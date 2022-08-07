import { TestBed } from '@angular/core/testing';

import { NdlServiceService } from './ndl-service.service';

describe('NdlServiceService', () => {
  let service: NdlServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NdlServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
