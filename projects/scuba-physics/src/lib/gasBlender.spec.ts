import { GasBlender, MixRequest } from './gasBlender';

describe('Gas Blender', () => {
    describe('Redundancies', () => {

        it('0 l volume in tankA returns tankB pressure', () => {
            const tankA = {
                startPressure: 10,
                volume: 0
            };
            const tankB = {
                startPressure: 10,
                volume: 10
            };

            const finalPressure = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure).toBeCloseTo(10);
        });

        it('0 l volume in tankB returns tankA pressure', () => {
            const tankA = {
                startPressure: 10,
                volume: 10
            };
            const tankB = {
                startPressure: 10,
                volume: 0
            };

            const finalPressure = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure).toBeCloseTo(10);
        });

        it('No volume in any tankB returns 0 bar pressure', () => {
            const tankA = {
                startPressure: 10,
                volume: 0
            };
            const tankB = {
                startPressure: 10,
                volume: 0
            };

            const finalPressure = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure).toBeCloseTo(0);
        });

        it('Identical pressure in both different tanks combines total volume', () => {
            const tankA = {
                startPressure: 50,
                volume: 10
            };
            const tankB = {
                startPressure: 50,
                volume: 20
            };

            const finalPressure = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure).toBeCloseTo(50);
        });

        it('Different pressure in both identical tanks combines gas volume', () => {
            const tankA = {
                startPressure: 100,
                volume: 10
            };
            const tankB = {
                startPressure: 50,
                volume: 10
            };

            const finalPressure = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure).toBeCloseTo(75);
        });

        it('Different pressure in both different tanks combines gas volume', () => {
            const tankA = {
                startPressure: 100,
                volume: 24
            };
            const tankB = {
                startPressure: 40,
                volume: 12
            };

            const finalPressure2 = GasBlender.redundancies(tankA, tankB);
            expect(finalPressure2).toBeCloseTo(80, 6);
        });
    });

    const createValidRequest = (): MixRequest => ({
        source: {
            pressure: 0,
            o2: .21,
            he: 0
        },
        target: {
            pressure: 200,
            o2: .32,
            he: 0
        },
        topMix: {
            o2: .21,
            he: 0
        },
        useO2: true,
        useHe: false
    });

    describe('Mix', () => {
        it('Ean32 from O2 and air to empty tank', () => {
            const request = createValidRequest();
            request.target.o2 = .32;

            const mixProcess = GasBlender.mix(request);
            expect(mixProcess.addO2).toBeCloseTo(27.812895, 6);
            expect(mixProcess.addTop).toBeCloseTo( 172.187105, 6);
        });

        // TODO add Mix test cases:
        // - some pressure needs to be released from source tank
        // - EAN to empty and non empty tank with the same and different content:
        //   - mix ean into topping with higher o2 content than required
        //   - mix ean into tank with target mix
        //   - mix ean into with different mix then requested
        // - Trimix into empty and non empty tank with the same and different content:
        //   - mix trimix to tank from o2, helium and air
        //   - mix trimix to tank from o2, helium and ean
        //   - mix trimix to tank from o2, helium and trimix
        //   - mix trimix to tank from o2 only and trimix
        //   - mix trimix to tank from he only and trimix
        //   - mix trimix to tank from he only and trimix
    });
});
