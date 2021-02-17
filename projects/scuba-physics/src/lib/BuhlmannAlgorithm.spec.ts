import { BuhlmannAlgorithm, DepthLevels, Options } from './BuhlmannAlgorithm';
import { Gas, Gases } from './Gases';
import { Segment, Segments } from './Segments';

describe('Buhlmann Algorithm', () => {
  describe('No decompression times', () => {
    it('Calculate air No decompression limit at surface', () => {
        const air: Gas = new Gas(0.21, 0);
        const depth = 0;
        const options = new Options(1, 1, 1.6, 1.6, 30, true);
        const algorithm = new BuhlmannAlgorithm();
        const ndl = algorithm.noDecoLimit(depth, air, options);
        expect(ndl).toBe(Infinity);
    });

    it('Calculate 0m if gas isn`t breathe-able at 60 m', () => {
      const air: Gas = new Gas(0.21, 0);
      const depth = 60;
      const options = new Options(1, 1, 1.4, 1.4, 30, true);
      const algorithm = new BuhlmannAlgorithm();
      const ndl = algorithm.noDecoLimit(depth, air, options);
      expect(ndl).toBe(0);
  });

   describe('Calculate air No decompression limits at depth', () => {
      const options = new Options(1, 1, 1.6, 1.6, 30, true);

      const calculateNoDecompressionLimit = (testCases: number[][], isFreshWater: boolean) => {
        testCases.forEach(testCase => {
          const algorithm = new BuhlmannAlgorithm();
          const air: Gas = new Gas(0.21, 0);
          const depth = testCase[0];
          options.isFreshWater = isFreshWater;
          const ndl = algorithm.noDecoLimit(depth, air, options);
          expect(ndl).toBe(testCase[1], 'No deco limit for "' + depth + '" failed');
        });
      };

      it('Fresh water', () => {
        // 0: depth, 1: ndl
        const noDecoLimitTestCases = [
          [10, 343], // From which depth to start count with deco?
          [12, 162],
          [15, 85],
          [18, 57],
          [21, 40],
          [24, 28],
          [27, 21],
          [30, 16],
          [33, 13],
          [36, 11],
          [39, 9],
          [42, 9],
          [100, 0], // Where is the limit for no decompression depth?
        ];

        calculateNoDecompressionLimit(noDecoLimitTestCases, true);
      });

      it('Fresh water with gradient factor 40/85', () => {
        const noDecoLimitTestCases = [
          [10, 209], // From which depth to start count with deco?
          [12, 112],
          [15, 65],
          [18, 41],
          [21, 28],
          [24, 20],
          [27, 15],
          [30, 12],
          [33, 10],
          [36, 8],
          [39, 7],
          [42, 7],
          [100, 0], // Where is the limit for no decompression depth?
        ];

        options.gfLow = .4;
        options.gfHigh = .85;
        calculateNoDecompressionLimit(noDecoLimitTestCases, true);
        options.gfLow = 1;
        options.gfHigh = 1;
      });

      it('Salt water', () => {
        const noDecoLimitTestCasesSalt = [
          [10, 293 ], // From which depth to start count with deco?
          [12, 149],
          [15, 80],
          [18, 54],
          [21, 38],
          [24, 27],
          [27, 20],
          [30, 15],
          [33, 13],
          [36, 10],
          [39, 8],
          [42, 8],
          [100, 0], // Where is the limit for no decompression depth?
        ];

        calculateNoDecompressionLimit(noDecoLimitTestCasesSalt, false);
      });
    });
  });

  describe('Calculates Plan', () =>  {
    const isFreshWater = false;
    // gradientFactorLow = 0.2, gradientFactorHigh=0.8, deco ppO2 = 1.6, and max END allowed: 30 meters.
    const options = new Options(0.2, 0.8, 1.6, 1.6, 30, isFreshWater);

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
      const planText = concatenatePlan(decoPlan.segments);

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
      const planText = concatenatePlan(decoPlan.segments);

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
      const planText = concatenatePlan(decoPlan.segments);

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
      const planText = concatenatePlan(decoPlan.segments);

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
      const planText = concatenatePlan(decoPlan.segments);

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
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,50,5;50,50,30;50,30,2;30,30,1;30,22,0.8;22,21,0.1;21,21,1;21,18,0.3;18,18,1;' +
                           '18,15,0.3;15,15,2;15,12,0.3;12,12,4;12,9,0.3;9,9,6;' +
                           '9,6,0.3;6,6,7;6,3,0.3;3,3,14;3,0,0.3;';
      expect(planText).toBe(expectedPlan);
    });
  });

  describe('DepthLevels', () => {
    it('A1', () => {
      const result = DepthLevels.firstDecoStop(true, 21, 30);
      expect(result).toBe(21);
    });

    it('A2', () => {
      const result = DepthLevels.firstDecoStop(true, 20, 30);
      expect(result).toBe(21);
    });

    it('A3', () => {
      const result = DepthLevels.firstDecoStop(true, 19, 30);
      expect(result).toBe(21);
    });

    it('A4', () => {
      const result = DepthLevels.firstDecoStop(false, 20, 30);
      expect(result).toBe(21);
    });

    it('C1', () => {
      const result = DepthLevels.firstDecoStop(true, 3, 3);
      expect(result).toBe(3);
    });

    it('C2', () => {
      const result = DepthLevels.firstDecoStop(false, 3, 3);
      expect(result).toBe(3);
    });

    it('C3', () => {
      const result = DepthLevels.firstDecoStop(false, 0, 2);
      expect(result).toBe(0);
    });

    it('C4', () => {
      const result = DepthLevels.firstDecoStop(true, 0, 2);
      expect(result).toBe(0);
    });

    it('D1', () => {
      const result = DepthLevels.firstDecoStop(true, 0, 4);
      expect(result).toBe(3);
    });

    it('D2', () => {
      const result = DepthLevels.firstDecoStop(true, 0, 3);
      expect(result).toBe(0);
    });

    it('D3', () => {
      const result = DepthLevels.firstDecoStop(false, 0, 3);
      expect(result).toBe(0);
    });
  });
});
