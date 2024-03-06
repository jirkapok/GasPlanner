import { GasBlender, MixRequest } from './gasBlender';

describe('Gas Blender', () => {
    const createEmptyRequest = (): MixRequest => ({
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

    const createNonEmptyRequest = (): MixRequest => {
        const result = createEmptyRequest();
        result.source.pressure = 50;
        return result;
    };

    const assertResult = (request: MixRequest, expectedTop: number, expectedO2: number,
        expectedHe: number, expecedRemove: number = 0): void => {
        const result = GasBlender.mix(request);

        expect(result.addTop).withContext('top pressure').toBeCloseTo(expectedTop, 6);
        expect(result.addO2).withContext('add O2').toBeCloseTo(expectedO2, 6);
        expect(result.addHe).withContext('add He').toBeCloseTo(expectedHe, 6);

        const sourcePressure = request.source.pressure - result.removeFromSource;
        const finalPpO2 = (request.source.o2 * sourcePressure + request.topMix.o2 * result.addTop + result.addO2)
                            / request.target.pressure;
        expect(request.target.o2).withContext('final pp O2').toBeCloseTo(finalPpO2, 6);
        const finalPpHe = (request.source.he * sourcePressure + request.topMix.he * result.addTop + result.addHe)
                            / request.target.pressure;
        expect(request.target.he).withContext('final pp He').toBeCloseTo(finalPpHe, 6);

        const total = sourcePressure + result.addTop + result.addO2 + result.addHe;
        expect(request.target.pressure).withContext('Sum pressures').toBeCloseTo(total, 6);
        expect(result.removeFromSource).toBeCloseTo(expecedRemove, 6);
    };

    describe('Parameters validation', () => {
        describe('Source', () => {
            it('Oxygen in source', () => {
                const parameters = createEmptyRequest();
                parameters.source.o2 = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Helium in source', () => {
                const parameters = createEmptyRequest();
                parameters.source.he = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Sum of parts in source', () => {
                const parameters = createEmptyRequest();
                parameters.source.o2 = 0.6;
                parameters.source.he = 0.6;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });
        });

        describe('Target', () => {
            it('Oxygen in Target', () => {
                const parameters = createEmptyRequest();
                parameters.target.o2 = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Helium in Target', () => {
                const parameters = createEmptyRequest();
                parameters.target.he = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Sum of parts in Target', () => {
                const parameters = createEmptyRequest();
                parameters.target.o2 = 0.6;
                parameters.target.he = 0.6;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });
        });

        describe('Top mix', () => {
            it('Oxygen in Top mix', () => {
                const parameters = createEmptyRequest();
                parameters.topMix.o2 = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Helium in Top mix', () => {
                const parameters = createEmptyRequest();
                parameters.topMix.he = 1.2;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });

            it('Sum of parts in Top mix', () => {
                const parameters = createEmptyRequest();
                parameters.topMix.o2 = 0.6;
                parameters.topMix.he = 0.6;
                expect(() => GasBlender.mix(parameters)).toThrow();
            });
        });
    });

    describe('Ean', () => {
        describe('into Empty tank', () => {
            it('Air from Air to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.21;
                request.topMix.o2 = 0.21;

                assertResult(request, 200, 0, 0);
            });

            it('Ean32 from O2 and air to empty tank', () => {
                const request = createEmptyRequest();
                request.topMix.o2 = 0.21;
                request.target.o2 = 0.32;

                assertResult(request, 172.151899, 27.848101, 0);
            });

            it('Ean50 from O2 and Ean32 to empty tank', () => {
                const request = createEmptyRequest();
                request.topMix.o2 = 0.32;
                request.target.o2 = 0.5;

                assertResult(request, 147.058824, 52.941176, 0);
            });

            it('Ignores small numbers rounding', () => {
                const request = createEmptyRequest();
                request.topMix.o2 = 0.32;
                request.target.o2 = 0.32;

                assertResult(request, 200, 0, 0);
            });

            it('Can`t create Air from Ean32 to empty tank', () => {
                const request = createEmptyRequest();
                request.topMix.o2 = 0.32;
                request.target.o2 = 0.21;

                expect(() => GasBlender.mix(request)).toThrow();
            });
        });

        describe('into NON Empty tank', () => {
            it('Air from Air to non empty tank', () => {
                const request = createNonEmptyRequest();
                request.target.o2 = 0.21;
                request.topMix.o2 = 0.21;

                assertResult(request, 150, 0, 0);
            });

            it('Ean32 from O2 and air to non empty tank', () => {
                const request = createNonEmptyRequest();
                request.topMix.o2 = 0.21;
                request.target.o2 = 0.32;

                assertResult(request, 122.151899, 27.848101, 0);
            });

            it('Ean50 from O2 and air to Ean32 tank', () => {
                const request = createNonEmptyRequest();
                request.source.o2 = 0.32;
                request.topMix.o2 = 0.21;
                request.target.o2 = 0.5;

                assertResult(request, 83.544304, 66.4556962, 0);
            });

            it('Can`t create Air from Ean32 to non empty tank', () => {
                const request = createNonEmptyRequest();
                request.topMix.o2 = 0.32;
                request.target.o2 = 0.21;

                expect(() => GasBlender.mix(request)).toThrow();
            });
        });
    });

    describe('Trimix', () => {
        describe('he into Empty tank', () => {
            it('25/25 using 25/25 to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.25;
                request.target.he = 0.25;
                request.topMix.o2 = 0.25;
                request.topMix.he = 0.25;

                assertResult(request, 200, 0, 0);
            });

            it('21/35 using O2, he and air to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.21;
                request.target.he = 0.35;
                request.topMix.o2 = 0.21;

                assertResult(request, 111.392405, 18.607595, 70);
            });

            it('18/45 using O2, he and Ean32 to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.18;
                request.target.he = 0.45;
                request.topMix.o2 = 0.32;

                assertResult(request, 108.823529, 1.176471, 90);
            });

            it('21/35 using 23/25 to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.21;
                request.target.he = 0.35;
                request.topMix.o2 = 0.23;
                request.topMix.he = 0.25;

                assertResult(request, 169.230769, 3.076923, 27.6923076);
            });

            it('35/25 using 25/25', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.35;
                request.target.he = 0.25;
                request.topMix.o2 = 0.25;
                request.topMix.he = 0.25;

                assertResult(request, 160, 30, 10);
            });

            it('Can`t create 18/45 using 25/25', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.18;
                request.target.he = 0.45;
                request.topMix.o2 = 0.25;
                request.topMix.he = 0.25;

                expect(() => GasBlender.mix(request)).toThrow();
            });

            it('Can`t create 21/35 using 17/45', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.21;
                request.target.he = 0.35;
                request.topMix.o2 = 0.17;
                request.topMix.he = 0.45;

                expect(() => GasBlender.mix(request)).toThrow();
            });
        });

        describe('he into non empty tank', () => {
            describe('from trimix', () => {
                it('25/25 from 25/25 using 25/25', () => {
                    const request = createNonEmptyRequest();
                    request.source.o2 = 0.25;
                    request.source.he = 0.25;
                    request.target.o2 = 0.25;
                    request.target.he = 0.25;
                    request.topMix.o2 = 0.25;
                    request.topMix.he = 0.25;

                    assertResult(request, 150, 0, 0);
                });

                it('21/35 from 21/35 using O2, he and air', () => {
                    const request = createNonEmptyRequest();
                    request.source.o2 = 0.21;
                    request.source.he = 0.35;
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;

                    assertResult(request, 83.544304, 13.955696, 52.5);
                });

                it('18/45 from 21/35 using 25/25', () => {
                    const request = createNonEmptyRequest();
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
                    const request = createNonEmptyRequest();
                    request.target.o2 = 0.18;
                    request.target.he = 0.45;
                    request.topMix.o2 = 0.32;

                    assertResult(request, 50.735294, 9.264706, 90);
                });

                it('21/35 using 23/25', () => {
                    const request = createNonEmptyRequest();
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.23;
                    request.topMix.he = 0.25;

                    assertResult(request, 93.269231, 10.048077,  46.682692);
                });
            });

            it('Can`t create 25/25 from 35/25 using 18/45', () => {
                const request = createNonEmptyRequest();
                request.source.o2 = 0.35;
                request.source.he = 0.25;
                request.target.o2 = 0.25;
                request.target.he = 0.25;
                request.topMix.o2 = 0.18;
                request.topMix.he = 0.45;

                expect(() => GasBlender.mix(request)).toThrow();
            });

            it('Can`t create 21/35 from 25/25 using 17/45', () => {
                const request = createNonEmptyRequest();
                request.source.o2 = 0.25;
                request.source.he = 0.25;
                request.target.o2 = 0.21;
                request.target.he = 0.35;
                request.topMix.o2 = 0.17;
                request.topMix.he = 0.45;

                expect(() => GasBlender.mix(request)).toThrow();
            });
        });
    });


    describe('Heliox', () => {
        it('Create 10/90 without top mix to empty tank', () => {
            const request = createEmptyRequest();
            request.target.o2 = 0.1;
            request.target.he = 0.9;
            request.topMix.o2 = 0.25;
            request.topMix.he = 0.25;

            assertResult(request, 0, 20, 180);
        });

        it('Create 5/95 without top mix to non empty tank', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.10;
            request.source.he = 0.90;
            request.target.o2 = 0.05;
            request.target.he = 0.95;
            request.topMix.o2 = 0.25;
            request.topMix.he = 0.25;

            assertResult(request, 0, 5, 145);
        });

        it('Can`t create trimix from mix with nitrox in empty tank', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.10;
            request.source.he = 0.70;
            request.target.o2 = 0.1;
            request.target.he = 0.9;
            request.topMix.o2 = 0.25;
            request.topMix.he = 0.25;

            assertResult(request, 0, 20, 180, 50);
        });
    });

    // no need to test 0 bar remove, since it is part of all other tests
    // test not only removed amount, but also the final result
    // using non standard mixtures to only test possibilities
    describe('Remove from source tank', () => {
        it('Ean50 from Ean32 needs to remove nitrogen', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.32;
            request.source.pressure = 200;
            request.target.o2 = 0.5;
            request.target.he = 0;
            request.topMix.o2 = 0.21;
            request.topMix.he = 0;

            assertResult(request, 0, 52.941176, 0, 52.941176);
        });

        it('Trimix 21/25 from 21/35 needs to remove helium', () => {
            const request = createNonEmptyRequest();
            request.source.he = 0.35;
            request.source.pressure = 200;
            request.target.he = 0.25;
            request.topMix.he = 0;

            assertResult(request, 57.142857, 0, 0, 57.142857);
        });

        it('Ean32 from Ean50 needs to remove oxygen', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.5;
            request.source.pressure = 200;
            request.target.o2 = 0.32;

            assertResult(request, 124.137931, 0, 0, 124.137931);
        });

        it('Trimix 15/30 from 25/35 needs to remove everything', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.25;
            request.source.he = 0.35;
            request.source.pressure = 100;
            request.target.o2 = 0.15;
            request.target.he = 0.30;

            assertResult(request, 136.563877, 0, 58.14978, 94.713656);
        });

        // no need to care about too much nitrogen in top mix, since we compensate it by adding O2 and He

        it('Unable to mix, because top mix contains more oxygen, than needed', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.5;
            request.target.o2 = 0.21;
            request.topMix.o2 = 0.32;

            expect(() => GasBlender.mix(request)).toThrow();
        });

        it('Unable to mix, because top mix contains more helium, than needed', () => {
            const request = createNonEmptyRequest();
            request.source.he = 0.35;
            request.target.he = 0.21;
            request.topMix.he = 0.45;

            expect(() => GasBlender.mix(request)).toThrow();
        });

        it('Unable to mix, because top mix contains more oxygen and helium, than needed', () => {
            const request = createNonEmptyRequest();
            request.source.he = 0.25;
            request.target.o2 = 0.10;
            request.target.he = 0.25;
            request.topMix.o2 = 0.18;
            request.topMix.he = 0.45;

            expect(() => GasBlender.mix(request)).toThrow();
        });

        it('Unable to mix, because top mix contains more oxygen and helium, source tank is empty', () => {
            const request = createNonEmptyRequest();
            request.source.pressure = 0;
            request.topMix.o2 = 0.18;
            request.topMix.he = 0.45;

            expect(() => GasBlender.mix(request)).toThrow();
        });
    });
});
