import { BuhlmannAlgorithm, Gas } from './BuhlmannAlgorithm';
import { assertNotNull } from '@angular/compiler/src/output/output_ast';

describe('Buhlmann Algorithm', () => {
  describe('No decompression times', () => {
    // 0: depth, 1: ndl
    const noDecoLimitTestCases = [
      [10, 494], // From which depth to start count with deco?
      [12, 205],
      [15, 98],
      [18, 65],
      [21, 44],
      [24, 31],
      [27, 23],
      [30, 17],
      [33, 14],
      [36, 12],
      [39, 10],
      [42, 8],
      [100, 2], // Where is the limit for no decompression depth?
    ];

    it('Calculate air No decompression limit at surface', () => {
        const algorithm = new BuhlmannAlgorithm();
        var air: Gas = new Gas(0.21, 0);
        var depth = 0;
        var ndl = algorithm.noDecoLimit(depth, air, 1, true);
        expect(ndl).toBe(Infinity);
    });

    it('Calculate air No decompression limits at depth', () => {
      noDecoLimitTestCases.forEach(testCase => {
        const algorithm = new BuhlmannAlgorithm();
        var air: Gas = new Gas(0.21, 0);
        var depth = testCase[0];
        var ndl = algorithm.noDecoLimit(depth, air, 1, true);
        expect(ndl).toBe(testCase[1], "No deco limit for '" + depth + "'m failed");
      });
    });
  });

  describe('Calculates Plan', () => {
    it('50m for 25 minutes using 21/35 and 50% nitrox', () => {
      const algorithm = new BuhlmannAlgorithm(); // 1 abs pressure in fresh water
      let bottomGas: Gas = new Gas(0.21, 0.35);
      algorithm.addBottomGas(bottomGas);
      let decoGas: Gas = new Gas(0.5, 0.0);
      algorithm.addDecoGas(decoGas);
      let isFreshWater = false;
      algorithm.addDepthChange(0, 50, bottomGas, 5, isFreshWater);
      algorithm.addFlat(50, bottomGas, 25, isFreshWater);
      //gradientFactorLow = 0.2, gradientFactorHigh=0.8, deco ppO2 = 1.6, and max END allowed: 30 meters.
      const decoPlan = algorithm.calculateDecompression(false, 0.2, 0.8, 1.6, 30, isFreshWater);
      let planText = "";
      decoPlan.forEach(segment => {
        planText += segment.startDepth + "," + segment.endDepth + "," + segment.time +";";
      });

      const expectedPlan = "0,50,5;50,50,25;50,30,2;30,30,1;" +
                           "30,22,0.8;22,21,0.1;21,21,1;21,18,0.3;" +
                           "18,18,1;18,15,0.3;15,15,1;15,12,0.3;12,12,3;" + 
                           "12,9,0.3;9,9,5;9,6,0.3;6,6,8;6,3,0.3;3,3,17;3,0,0.3;";
      expect(planText).toBe(expectedPlan);
    });
  }); 
});
