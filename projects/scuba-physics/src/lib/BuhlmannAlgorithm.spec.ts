import { BuhlmannAlgorithm, Options } from './BuhlmannAlgorithm';
import { Gas, Gases } from './Gases';
import { Segment, Segments } from './Segments';

describe('Buhlmann Algorithm', () => {
  describe('No decompression times', () => {

    it('Calculate air No decompression limit at surface', () => {
        const algorithm = new BuhlmannAlgorithm();
        const air: Gas = new Gas(0.21, 0);
        const depth = 0;
        const ndl = algorithm.noDecoLimit(depth, air, 1, true);
        expect(ndl).toBe(Infinity);
    });

    describe('Calculate air No decompression limits at depth', () => {
      const calculateNoDecompressionLimit = (testCases: number[][], isFreshWater: boolean) => {
        testCases.forEach(testCase => {
          const algorithm = new BuhlmannAlgorithm();
          const air: Gas = new Gas(0.21, 0);
          const depth = testCase[0];
          const ndl = algorithm.noDecoLimit(depth, air, 1, isFreshWater);
          expect(ndl).toBe(testCase[1], 'No deco limit for "' + depth + '" failed');
        });
      };

      it('Fresh water', () => {
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

        calculateNoDecompressionLimit(noDecoLimitTestCases, true);
      });

      it('Salt water', () => {
        const noDecoLimitTestCasesSalt = [
          [10, 424 ], // From which depth to start count with deco?
          [12, 182],
          [15, 92],
          [18, 60],
          [21, 41],
          [24, 29],
          [27, 21],
          [30, 16],
          [33, 13],
          [36, 11],
          [39, 9],
          [42, 8],
          [100, 2], // Where is the limit for no decompression depth?
        ];

        calculateNoDecompressionLimit(noDecoLimitTestCasesSalt, false);
      });
    });
  });

  describe('Calculates Plan', () =>  {
    const isFreshWater = false;
    // gradientFactorLow = 0.2, gradientFactorHigh=0.8, deco ppO2 = 1.6, and max END allowed: 30 meters.
    const options = new Options(true, 0.2, 0.8, 1.6, 30, isFreshWater);

    const concatenatePlan = (decoPlan: Segment[]): string => {
      let planText = '';
      decoPlan.forEach(segment => {
        planText += segment.startDepth + ',' + segment.endDepth + ',' + segment.duration + ';';
      });

      return planText;
    };

    it('5m for 30 minutes using ean32', () => {
      const bottomGas: Gas = new Gas(0.32, 0);
      const gases: Gases = new Gases();
      gases.addBottomGas(bottomGas);

      const segments = new Segments();
      segments.add(0, 5, bottomGas, 1);
      segments.addFlat(5, bottomGas, 30);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const epectedPlan = '0,5,1;5,5,30;5,0,0.5;';
      expect(planText).toBe(epectedPlan);
    });

    it('10m for 40 minutes using air', () => {
      const gases = new Gases();
      const bottomGas: Gas = new Gas(0.21, 0);
      gases.addBottomGas(bottomGas);

      const segments = new Segments();
      segments.add(0, 10, bottomGas, 1);
      segments.addFlat(10, bottomGas, 40);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const epectedPlan = '0,10,1;10,10,40;10,3,0.7;3,3,1;3,0,0.3;';
      expect(planText).toBe(epectedPlan);
    });

    it('30m for 25 minutes using air', () => {
      const gases = new Gases();
      const bottomGas: Gas = new Gas(0.21, 0);
      gases.addBottomGas(bottomGas);

      const segments = new Segments();
      segments.add(0, 30, bottomGas, 2);
      segments.addFlat(30, bottomGas, 25);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const epectedPlan = '0,30,2;30,30,25;30,15,1.5;15,15,1;15,9,0.6;9,9,1;9,6,0.3;6,6,3;6,3,0.3;3,3,10;3,0,0.3;';
      expect(planText).toBe(epectedPlan);
    });

    it('40m for 30 minutes using air and ean50', () => {
      const gases = new Gases();
      const bottomGas: Gas = new Gas(0.21, 0);
      gases.addBottomGas(bottomGas);
      const decoGas: Gas = new Gas(0.5, 0);
      gases.addBottomGas(decoGas);

      const segments = new Segments();
      segments.add(0, 40, bottomGas, 3);
      segments.addFlat(40, bottomGas, 30);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const epectedPlan = '0,40,3;40,40,30;40,24,1.6;24,24,1;24,22,0.2;22,18,0.4;18,18,1;18,15,0.3;' +
                          '15,15,1;15,12,0.3;12,12,1;12,9,0.3;9,9,5;9,6,0.3;6,6,7;6,3,0.3;3,3,15;3,0,0.3;';
      expect(planText).toBe(epectedPlan);
    });

    it('50m for 25 minutes using 21/35 and 50% nitrox', () => {
      const gases = new Gases();
      const bottomGas: Gas = new Gas(0.21, 0.35);
      gases.addBottomGas(bottomGas);
      const decoGas: Gas = new Gas(0.5, 0.0);
      gases.addDecoGas(decoGas);

      const segments = new Segments();
      segments.add(0, 50, bottomGas, 5);
      segments.addFlat(50, bottomGas, 25);

      const algorithm = new BuhlmannAlgorithm(); // 1 abs pressure in fresh water
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const expectedPlan = '0,50,5;50,50,25;50,30,2;30,30,1;' +
                           '30,22,0.8;22,21,0.1;21,21,1;21,18,0.3;' +
                           '18,18,1;18,15,0.3;15,15,1;15,12,0.3;12,12,3;' +
                           '12,9,0.3;9,9,5;9,6,0.3;6,6,8;6,3,0.3;3,3,17;3,0,0.3;';
      expect(planText).toBe(expectedPlan);
    });

    it('50m for 30 minutes using 21/35, 50% nitrox and oxygen', () => {
      const bottomGas: Gas = new Gas(0.21, 0.35);
      const gases = new Gases();
      gases.addBottomGas(bottomGas);
      const ean50: Gas = new Gas(0.5, 0.0);
      gases.addDecoGas(ean50);
      const oxygen: Gas = new Gas(1, 0.0);
      gases.addDecoGas(oxygen);

      const segments = new Segments();
      const algorithm = new BuhlmannAlgorithm(); // 1 abs pressure in fresh water
      segments.add(0, 50, bottomGas, 5);
      segments.addFlat(50, bottomGas, 30);

      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan);

      const expectedPlan = '0,50,5;50,50,30;50,30,2;30,30,1;30,22,0.8;22,21,0.1;21,21,1;21,18,0.3;18,18,1;' +
                           '18,15,0.3;15,15,2;15,12,0.3;12,12,4;12,9,0.3;9,9,6;' +
                           '9,6,0.3;6,6,7;6,3,0.3;3,3,14;3,0,0.3;';
      expect(planText).toBe(expectedPlan);
    });
  });
});
