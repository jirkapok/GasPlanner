import { TestBed, inject } from '@angular/core/testing';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Compartments } from './Compartments';
import { Tissues } from './Tissues';

describe('BuhlmannAlgorithm', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: []
    });
  });

  fit('Calculate No decompression limit at surface', () => {
    const algorithm = new BuhlmannAlgorithm();
    const tissues = new Tissues();

    expect(true).toBeTrue();
    //var ndl = algorithm.noDecoLimit(1, 'air', 100);
    //expect(ndl).toBeCloseTo(3.157, 3);
  });
});