import { DepthLevels } from './DepthLevels';

describe('Depth Levels', () => {
    describe('First stop', () => {
        it('Rounds to 3 meter increments', () => {
            const result = DepthLevels.firstStop(17.6);
            expect(result).toBe(15);
        });

        it('At 12 m returns first stop at 9 meters', () => {
            const result = DepthLevels.firstStop(12);
            expect(result).toBe(9);
        });

        it('Is 0 meters bellow last stop option', () => {
            const result = DepthLevels.firstStop(2);
            expect(result).toBe(0);
        });

        it('Is 0 meters at 5 meters in case last stop 6 m', () => {
            DepthLevels.lastStopDepth = 6;
            const result = DepthLevels.firstStop(5);
            DepthLevels.lastStopDepth = 3;
            expect(result).toBe(0);
        });
    });

    describe('Next stop', () => {
        it('At 12 m returns next stop at 9 meters', () => {
            const result = DepthLevels.nextStop(9);
            expect(result).toBe(6);
        });

        it('Returns negative number bellow 3 m last stop', () => {
            const result = DepthLevels.nextStop(2);
            expect(result).toBeLessThan(0);
        });

        it('Is negative number at 4 meters in case last stop 6 m', () => {
            DepthLevels.lastStopDepth = 6;
            const result = DepthLevels.nextStop(4);
            DepthLevels.lastStopDepth = 3;
            expect(result).toBeLessThan(0);
        });
    });
});
