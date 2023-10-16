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

    const createValidEmptyRequest = (): MixRequest => ({
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

    const createValidNonEmptyRequest = (): MixRequest => {
        const result = createValidEmptyRequest();
        result.source.pressure = 50;
        return result;
    };

    describe('Mix', () => {
        describe('Ean', () => {
            describe('into Empty tank', () => {
                it('Air from Air to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.21;
                    request.topMix.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(0, 6);
                    expect(mixProcess.addTop).toBeCloseTo(200, 6);
                });

                it('Ean32 from O2 and air to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.21;
                    request.target.o2 = 0.32;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(27.848101, 6);
                    expect(mixProcess.addTop).toBeCloseTo(172.151899, 6);
                });

                it('Ean50 from O2 and Ean32 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.5;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(52.941176, 6);
                    expect(mixProcess.addTop).toBeCloseTo(147.058824, 6);
                });

                it('Cant create Air from Ean32 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(-32.352941, 6);
                    expect(mixProcess.addTop).toBeCloseTo(0, 6);
                });
            });

            fdescribe('into NON Empty tank', () => {
                it('Air from Air to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.target.o2 = 0.21;
                    request.topMix.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(0, 6);
                    expect(mixProcess.addTop).toBeCloseTo(150, 6);
                });

                fit('Ean32 from O2 and air to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.topMix.o2 = 0.21;
                    request.target.o2 = 0.32;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(27.848101, 6);
                    expect(mixProcess.addTop).toBeCloseTo(172.151899, 6);
                });

                it('Ean50 from O2 and Ean32 to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.5;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(52.941176, 6);
                    expect(mixProcess.addTop).toBeCloseTo(147.058824, 6);
                });

                it('Cant create Air from Ean32 to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(-32.352941, 6);
                    expect(mixProcess.addTop).toBeCloseTo(0, 6);
                });
            });
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
