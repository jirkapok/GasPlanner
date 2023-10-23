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
            o2: .21,
            he: 0
        },
        topMix: {
            o2: .21,
            he: 0
        }
    });

    const createValidNonEmptyRequest = (): MixRequest => {
        const result = createValidEmptyRequest();
        result.source.pressure = 50;
        return result;
    };

    const assertResult = (request: MixRequest, expectedTop: number, expectedO2: number, expectedHe: number): void => {
        const result = GasBlender.mix(request);

        expect(result.addTop).withContext('top pressure').toBeCloseTo(expectedTop, 6);
        expect(result.addO2).withContext('add O2').toBeCloseTo(expectedO2, 6);
        expect(result.addHe).withContext('add He').toBeCloseTo(expectedHe, 6);

        const finalPpO2 = (request.source.o2 * request.source.pressure + request.topMix.o2 * result.addTop + result.addO2)
                            / request.target.pressure;
        expect(request.target.o2).withContext('final pp O2').toBeCloseTo(finalPpO2, 6);
        const finalPpHe = (request.source.he * request.source.pressure + request.topMix.he * result.addTop + result.addHe)
                            / request.target.pressure;
        expect(request.target.he).withContext('final pp He').toBeCloseTo(finalPpHe, 6);

        const total = request.source.pressure + result.addTop + result.addO2 + result.addHe;
        expect(request.target.pressure).withContext('Sum pressures').toBeCloseTo(total, 6);
    };

    describe('Mix', () => {
        describe('Ean', () => {
            describe('into Empty tank', () => {
                it('Air from Air to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.21;
                    request.topMix.o2 = 0.21;

                    assertResult(request, 200, 0, 0);
                });

                it('Ean32 from O2 and air to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.21;
                    request.target.o2 = 0.32;

                    assertResult(request, 172.151899, 27.848101, 0);
                });

                it('Ean50 from O2 and Ean32 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.5;

                    assertResult(request, 147.058824, 52.941176, 0);
                });

                it('Can`t create Air from Ean32 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(-32.352941, 6);
                    expect(mixProcess.addTop).toBeCloseTo(232.352941, 6);
                });
            });

            describe('into NON Empty tank', () => {
                it('Air from Air to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.target.o2 = 0.21;
                    request.topMix.o2 = 0.21;

                    assertResult(request, 150, 0, 0);
                });

                it('Ean32 from O2 and air to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.topMix.o2 = 0.21;
                    request.target.o2 = 0.32;

                    assertResult(request, 122.151899, 27.848101, 0);
                });

                it('Ean50 from O2 and air to Ean32 tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.source.o2 = 0.32;
                    request.topMix.o2 = 0.21;
                    request.target.o2 = 0.5;

                    assertResult(request, 83.544304, 66.4556962, 0);
                });

                it('Can`t create Air from Ean32 to non empty tank', () => {
                    const request = createValidNonEmptyRequest();
                    request.topMix.o2 = 0.32;
                    request.target.o2 = 0.21;

                    const mixProcess = GasBlender.mix(request);
                    expect(mixProcess.addO2).toBeCloseTo(-24.264706, 6);
                    expect(mixProcess.addTop).toBeCloseTo(174.264706, 6);
                });
            });
        });

        describe('Trimix', () => {
            describe('he into Empty tank', () => {
                it('25/25 using 25/25 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.25;
                    request.target.he = 0.25;
                    request.topMix.o2 = 0.25;
                    request.topMix.he = 0.25;

                    assertResult(request, 200, 0, 0);
                });

                it('21/35 using O2, he and air to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.21;

                    assertResult(request, 111.392405, 18.607595, 70);
                });

                it('18/45 using O2, he and Ean32 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.18;
                    request.target.he = 0.45;
                    request.topMix.o2 = 0.32;

                    assertResult(request, 108.823529, 1.176471, 90);
                });

                it('21/35 using 23/25 to empty tank', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.23;
                    request.topMix.he = 0.25;

                    assertResult(request, 169.230769, 3.076923, 27.6923076);
                });

                it('35/25 using 25/25', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.35;
                    request.target.he = 0.25;
                    request.topMix.o2 = 0.25;
                    request.topMix.he = 0.25;

                    assertResult(request, 160, 30, 10);
                });

                it('Can`t create 18/45 using 25/25', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.18;
                    request.target.he = 0.45;
                    request.topMix.o2 = 0.25;
                    request.topMix.he = 0.25;

                    assertResult(request, 148, -1, 53);
                });

                it('Can`t create 21/35 using 17/45', () => {
                    const request = createValidEmptyRequest();
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.17;
                    request.topMix.he = 0.45;

                    assertResult(request, 231.578947, 2.631579, -34.210526);
                });
            });

            describe('he into non empty tank', () => {
                describe('from trimix', () => {
                    it('25/25 from 25/25 using 25/25', () => {
                        const request = createValidNonEmptyRequest();
                        request.source.o2 = 0.25;
                        request.source.he = 0.25;
                        request.target.o2 = 0.25;
                        request.target.he = 0.25;
                        request.topMix.o2 = 0.25;
                        request.topMix.he = 0.25;

                        assertResult(request, 150, 0, 0);
                    });

                    it('21/35 from 21/35 using O2, he and air', () => {
                        const request = createValidNonEmptyRequest();
                        request.source.o2 = 0.21;
                        request.source.he = 0.35;
                        request.target.o2 = 0.21;
                        request.target.he = 0.35;

                        assertResult(request, 83.544304, 13.955696, 52.5);
                    });

                    it('18/45 from 21/35 using 25/25', () => {
                        const request = createValidNonEmptyRequest();
                        request.source.o2 = 0.25;
                        request.source.he = 0.25;
                        request.target.o2 = 0.18;
                        request.target.he = 0.45;
                        request.topMix.o2 = 0.21;
                        request.topMix.he = 0.25;

                        assertResult(request, 90.740741, 4.444444, 54.814815);
                    });
                });

                describe('from air', () => {
                    it('18/45 using O2, he and Ean32', () => {
                        const request = createValidNonEmptyRequest();
                        request.target.o2 = 0.18;
                        request.target.he = 0.45;
                        request.topMix.o2 = 0.32;

                        assertResult(request, 50.735294, 9.264706, 90);
                    });

                    it('21/35 using 23/25', () => {
                        const request = createValidNonEmptyRequest();
                        request.target.o2 = 0.21;
                        request.target.he = 0.35;
                        request.topMix.o2 = 0.23;
                        request.topMix.he = 0.25;

                        assertResult(request, 93.269231, 10.048077,  46.682692);
                    });
                });

                it('Can`t create 25/25 from 35/25 using 18/45', () => {
                    const request = createValidNonEmptyRequest();
                    request.source.o2 = 0.35;
                    request.source.he = 0.25;
                    request.target.o2 = 0.25;
                    request.target.he = 0.25;
                    request.topMix.o2 = 0.18;
                    request.topMix.he = 0.45;

                    assertResult(request, 216.216216, -6.418919, -59.797297);
                });

                it('Can`t create 21/35 from 25/25 using 17/45', () => {
                    const request = createValidNonEmptyRequest();
                    request.source.o2 = 0.25;
                    request.source.he = 0.25;
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.17;
                    request.topMix.he = 0.45;

                    assertResult(request, 165.789474, 1.315789, -17.105263);
                });
            });
        });

        // TODO add Mix test cases:
        // - Heliox where there is 0 % fN2 still calculates (division by 0 exception)
    });
});
