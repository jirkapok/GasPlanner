import { DepthConverter } from '../depth-converter';
import { DepthLevels } from './DepthLevels';
import { SafetyStop } from '../algorithm/Options';

describe('Depth Levels', () => {
    const irrelevantDepthConverter = DepthConverter.simple();
    const options = {
        lastStopDepth: 5,
        safetyStop: SafetyStop.always,
        decoStopDistance: 3,
        minimumAutoStopDepth: 10
    };

    const levels = new DepthLevels(irrelevantDepthConverter, options);

    beforeEach(() => {
        options.lastStopDepth = 5;
        options.safetyStop = SafetyStop.always;
        options.decoStopDistance = 3;
        options.minimumAutoStopDepth = 10;
    });

    describe('Next stop', () => {
        it('Rounds to 3 meter increments', () => {
            options.lastStopDepth = 3;
            const result = levels.nextStop(17.6);
            expect(result).toBe(15);
        });

        it('At 12 m returns first stop at 9 meters', () => {
            options.lastStopDepth = 3;
            const result = levels.nextStop(12);
            expect(result).toBe(9);
        });

        it('At 12 m returns next stop at 9 meters', () => {
            options.lastStopDepth = 3;
            const result = levels.nextStop(9);
            expect(result).toBe(6);
        });

        it('Returns 0 m bellow 3 m last stop', () => {
            options.lastStopDepth = 6;
            const result = levels.nextStop(5);
            expect(result).toBe(0);
        });

        it('Is 5 m from 6 m in case last stop 5 m', () => {
            options.lastStopDepth = 5;
            const result = levels.nextStop(6);
            expect(result).toBe(5);
        });

        it('Is 0 meters at 6 meters in case last stop 6 m', () => {
            options.lastStopDepth = 6;
            const result = levels.nextStop(6);
            expect(result).toBe(0);
        });

        describe('With 5 m Deco stop distance', () => {
            beforeEach(() => {
                options.decoStopDistance = 5;
            });

            it('Is 20 meters at 23 meters', () => {
                const result = levels.nextStop(23);
                expect(result).toBe(20);
            });

            it('Is 15 meters at 20 meters', () => {
                const result = levels.nextStop(20);
                expect(result).toBe(15);
            });
        });
    });



    describe('Add safety stop', () => {
        it('Minimum auto stop depth is applied', () => {
            options.minimumAutoStopDepth = 20;
            options.safetyStop = SafetyStop.auto;
            const result = levels.addSafetyStop(5, 15);
            expect(result).toBeFalsy();
        });

        beforeEach(() => {
            options.minimumAutoStopDepth = 10;
        });

        describe('Always', () => {
            beforeEach(() => {
                options.safetyStop = SafetyStop.always;
            });

            it('Deep dive below last stop', () => {
                const result = levels.addSafetyStop(7, 40);
                expect(result).toBeFalsy();
            });

            it('Deep dive at stop', () => {
                const result = levels.addSafetyStop(5, 40);
                expect(result).toBeTruthy();
            });

            it('Below last stop', () => {
                const result = levels.addSafetyStop(7, 7);
                expect(result).toBeFalsy();
            });

            it('At last stop', () => {
                const result = levels.addSafetyStop(5, 5);
                expect(result).toBeTruthy();
            });
        });

        describe('Auto', () => {
            beforeEach(() => {
                options.safetyStop = SafetyStop.auto;
            });

            it('Deep dive below stop', () => {
                const result = levels.addSafetyStop(10, 40);
                expect(result).toBeFalsy();
            });

            it('Deep dive, at stop', () => {
                const result = levels.addSafetyStop(5, 40);
                expect(result).toBeTruthy();
            });

            it('Below stop', () => {
                const result = levels.addSafetyStop(10, 10);
                expect(result).toBeFalsy();
            });

            it('At the stop', () => {
                const result = levels.addSafetyStop(5, 10);
                expect(result).toBeFalsy();
            });
        });

        describe('Never', () => {
            beforeEach(() => {
                options.safetyStop = SafetyStop.never;
            });

            it('Deep dive, below stop', () => {
                const result = levels.addSafetyStop(7, 40);
                expect(result).toBeFalsy();
            });

            it('Deep dive at 5 m stop', () => {
                const result = levels.addSafetyStop(5, 40);
                expect(result).toBeFalsy();
            });

            it('Below', () => {
                const result = levels.addSafetyStop(7, 7);
                expect(result).toBeFalsy();
            });

            it('At 5 m stop', () => {
                const result = levels.addSafetyStop(5, 5);
                expect(result).toBeFalsy();
            });
        });
    });
});
