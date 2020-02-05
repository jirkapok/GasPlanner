import { BuhlmannAlgorithm, Gas } from './BuhlmannAlgorithm';

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
});
