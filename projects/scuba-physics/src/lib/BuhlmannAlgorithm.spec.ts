import { Time } from './Time';
import { BuhlmannAlgorithm, Options } from './BuhlmannAlgorithm';
import { Gas, Gases } from './Gases';
import { Segment, Segments } from './Segments';

describe('Buhlmann Algorithm', () => {
  const air: Gas = new Gas(0.21, 0); 
  const ean32: Gas = new Gas(0.32, 0);
  const ean50: Gas = new Gas(0.5, 0);
  const oxygen: Gas = new Gas(1, 0);
  const trimix2135: Gas = new Gas(0.21, 0.35);

  describe('No decompression times', () => {
    it('Calculate air No decompression limit at surface', () => {
        const depth = 0;
        const options = new Options(1, 1, 1.6, 1.6, 30, true);
        const algorithm = new BuhlmannAlgorithm();
        const ndl = algorithm.noDecoLimit(depth, air, options);
        expect(ndl).toBe(Infinity);
    });

    it('Calculate 0m if gas isn`t breathe-able at 60 m', () => {
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
    // gradientFactorLow = 0.4, gradientFactorHigh=0.85, deco ppO2 = 1.6, and max END allowed: 30 meters.
    // we don't need to change the gradient factors, because its application is already confirmed by the ascent times and no deco times
    const options = new Options(0.4, 0.85, 1.4, 1.6, 30, false, true);

    beforeEach(() => {
        options.addSafetyStop = true;
        options.roundStopsToMinutes = true;
    });

    const concatenatePlan = (decoPlan: Segment[]): string => {
      let planText = '';
      decoPlan.forEach(segment => {
        planText += segment.startDepth + ',' + segment.endDepth + ',' + segment.duration + '; ';
      });

      return planText.trim();
    };

    it('5m for 30 minutes using ean32 without safety stop', () => {
      const gases: Gases = new Gases();
      gases.addBottomGas(ean32);

      const segments = new Segments();
      segments.add(0, 5, ean32, 15);
      segments.addFlat(5, ean32, 29.75 * Time.oneMinute);

      options.addSafetyStop = false;
      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,5,15; 5,5,1785; 5,0,30;';
      expect(planText).toBe(expectedPlan);
    });

    it('10m for 40 minutes using air with safety stop at 3m', () => {
      const gases = new Gases();
      gases.addBottomGas(air);

      const segments = new Segments();
      segments.add(0, 10, air, 30);
      segments.addFlat(10, air, 39.5 * Time.oneMinute);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,10,30; 10,10,2370; 10,3,42; 3,3,180; 3,0,18;';
      expect(planText).toBe(expectedPlan);
    });

    it('30m for 25 minutes using air', () => {
      const gases = new Gases();
      gases.addBottomGas(air);

      const segments = new Segments();
      segments.add(0, 30, air, 1.5 * Time.oneMinute);
      segments.addFlat(30, air, 23.5 * Time.oneMinute);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,30,90; 30,30,1410; 30,30,0; 30,12,108; 12,12,60; 12,9,18; ' +
                           '9,9,60; 9,6,18; 6,6,180; 6,3,18; 3,3,480; 3,0,18;';
      expect(planText).toBe(expectedPlan);
    });

    it('40m for 30 minutes using air and ean50', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      gases.addBottomGas(ean50);

      const segments = new Segments();
      segments.add(0, 40, air, 2 * Time.oneMinute);
      segments.addFlat(40, air, 28 * Time.oneMinute);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,40,120; 40,40,1680; 40,21,114; 21,21,60; 21,15,36; 15,15,60; 15,12,18; ' +
                           '12,12,180; 12,9,18; 9,9,180; 9,6,18; 6,6,360; 6,3,18; 3,3,900; 3,0,18;';
      expect(planText).toBe(expectedPlan);
    });

    it('50m for 25 minutes using 21/35 and 50% nitrox', () => {
      const gases = new Gases();
      gases.addBottomGas(trimix2135);
      gases.addDecoGas(ean50);

      const segments = new Segments();
      segments.add(0, 50, trimix2135, 2.5 * Time.oneMinute);
      segments.addFlat(50, trimix2135, 22.5 * Time.oneMinute);

      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);
      
      const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                           '18,18,60; 18,15,18; 15,15,120; 15,12,18; 12,12,120; 12,9,18; ' +
                           '9,9,240; 9,6,18; 6,6,360; 6,3,18; 3,3,960; 3,0,18;';
      expect(planText).toBe(expectedPlan);
    });

    it('50m for 30 minutes using 21/35, 50% nitrox and oxygen - no rounding', () => {
      const gases = new Gases();
      gases.addBottomGas(trimix2135);
      gases.addDecoGas(ean50);
      gases.addDecoGas(oxygen);

      const segments = new Segments();
      segments.add(0, 50, trimix2135, 2.5 * Time.oneMinute);
      segments.addFlat(50, trimix2135, 22.5 * Time.oneMinute);
      
      options.roundStopsToMinutes = false;
      const algorithm = new BuhlmannAlgorithm();
      const decoPlan = algorithm.calculateDecompression(options, gases, segments);
      const planText = concatenatePlan(decoPlan.segments);

      const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                           '18,18,35; 18,15,18; 15,15,86; 15,12,18; 12,12,137; 12,9,18; ' +
                           '9,9,229; 9,6,18; 6,6,274; 6,3,18; 3,3,697; 3,0,18;';
      expect(planText).toBe(expectedPlan);
    });

    // TODO add algorithm test cases:
    // A: 30m, 10min., gases: .21 .5 1.0; fresh, 0masl.
    // - gas switch in 21m and 6m, i - even no deco

    // B: 30m, 10min., gases: .21 .32; fresh, 0masl.
    // - gas switch in 30m, even no deco

    // C: where deco is increased even during ascent

    // D: Disabled safety stop is not added to the last stop, even for no decompression dives below 10 meters

    // E: Safety stop is correctly applied at expected depth

    // F: 2m, 60min, gases: .21; fresh, 0masl. No safety stop and direct ascent to surface.
    // G: 3m, 60min, gases: .21; fresh, 0masl. No safety stop and direct ascent to surface.

    // H: Multiple gases with identical content don't generate multiple gas switches at the same level
   
    // I: Gases: 18/45, oxygen to 80m for 20min, option air breaks = true; there should be breaks at 6m back to trimix
    



    // TODO multi level dives test cases:
    // A: where first segment gets deco and second segment breaks ceiling before we start ascent. Add this to warnings.
    // during this dive on second level we are already decompressing anyway, so once the ceiling should be lower than current depth.
  });
});
