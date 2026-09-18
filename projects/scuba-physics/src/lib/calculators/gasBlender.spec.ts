import { GasBlender, MixRequest } from './gasBlender';
import { Compressibility } from '../physics/compressibility';
import { Gas } from '../gases/Gases';

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
        expectedHe: number, expectedRemove: number = 0): void => {
        // Compressibility.pressure() converges to an absolute residual tolerance rather than a pressure
        // tolerance, so chained real-gas conversions (e.g. the recursive removal path, plus this helper's
        // own independent recomputation) can each add up to ~1e-6 b of noise.
        const precision = 5;
        const result = GasBlender.mix(request);

        expect(result.addTop).withContext('top pressure').toBeCloseTo(expectedTop, precision);
        expect(result.addO2).withContext('add O2').toBeCloseTo(expectedO2, precision);
        expect(result.addHe).withContext('add He').toBeCloseTo(expectedHe, precision);
        expect(result.removeFromSource).withContext('remove from source').toBeCloseTo(expectedRemove, precision);

        const compressibility = new Compressibility();
        const targetGas = new Gas(request.target.o2, request.target.he);
        const sourceGas = new Gas(request.source.o2, request.source.he);
        const remainingSourcePressure = request.source.pressure - result.removeFromSource;
        const sourceVolume = compressibility.normalVolume(remainingSourcePressure, sourceGas);
        const targetVolume = compressibility.normalVolume(request.target.pressure, targetGas);
        const targetN2Volume = targetGas.fN2 * targetVolume;
        const sourceN2Volume = sourceGas.fN2 * sourceVolume;
        const topN2 = 1 - request.topMix.o2 - request.topMix.he;
        const topVolume = (targetN2Volume - sourceN2Volume) / topN2;
        const heVolume = targetGas.fHe * targetVolume - sourceGas.fHe * sourceVolume - request.topMix.he * topVolume;
        const o2Volume = targetVolume - sourceVolume - heVolume - topVolume;

        expect(result.addO2).withContext('add O2 is non-negative').toBeGreaterThanOrEqual(0);
        expect(result.addHe).withContext('add He is non-negative').toBeGreaterThanOrEqual(0);
        expect(result.addTop).withContext('add top is non-negative').toBeGreaterThanOrEqual(0);
        expect(heVolume).withContext('required He normal volume').toBeGreaterThanOrEqual(-1e-6);
        expect(o2Volume).withContext('required O2 normal volume').toBeGreaterThanOrEqual(-1e-6);
        expect(topVolume).withContext('required top normal volume').toBeGreaterThanOrEqual(-1e-6);

        const pressureForVolume = (volume: number, o2VolumeValue: number, heVolumeValue: number): number => {
            if (volume === 0) {
                return 0;
            }

            return compressibility.pressure(new Gas(o2VolumeValue / volume, heVolumeValue / volume), volume);
        };
        const volumeAfterHe = sourceVolume + heVolume;
        const pressureAfterHe = pressureForVolume(
            volumeAfterHe,
            sourceGas.fO2 * sourceVolume,
            sourceGas.fHe * sourceVolume + heVolume
        );
        const volumeAfterO2 = volumeAfterHe + o2Volume;
        const pressureAfterO2 = pressureForVolume(
            volumeAfterO2,
            sourceGas.fO2 * sourceVolume + o2Volume,
            sourceGas.fHe * sourceVolume + heVolume
        );

        expect(result.addHe).withContext('helium fill pressure').toBeCloseTo(pressureAfterHe - remainingSourcePressure, precision);
        expect(result.addO2).withContext('oxygen fill pressure').toBeCloseTo(pressureAfterO2 - pressureAfterHe, precision);
        expect(result.addTop).withContext('top fill pressure').toBeCloseTo(request.target.pressure - pressureAfterO2, precision);
        expect(remainingSourcePressure + result.addHe + result.addO2 + result.addTop)
            .withContext('staged pressures reach target').toBeCloseTo(request.target.pressure, precision);
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

                assertResult(request, 173.284493, 26.715507, 0);
            });

            it('returns real-gas staged pressures for Ean32 from O2 and air', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.32;

                const result = GasBlender.mix(request);

                expect(result.addHe).toBeCloseTo(0, 6);
                expect(result.addO2).toBeCloseTo(26.715507, 6);
                expect(result.addTop).toBeCloseTo(173.284493, 6);
            });

            it('Ean50 from O2 and Ean32 to empty tank', () => {
                const request = createEmptyRequest();
                request.topMix.o2 = 0.32;
                request.target.o2 = 0.5;

                assertResult(request, 148.959798, 51.040202, 0);
            });

            it('Fixes small numbers rounding', () => {
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

                assertResult(request, 123.85206, 26.14794, 0);
            });

            it('Ean50 from O2 and air to Ean32 tank', () => {
                const request = createNonEmptyRequest();
                request.source.o2 = 0.32;
                request.topMix.o2 = 0.21;
                request.target.o2 = 0.5;

                assertResult(request, 87.063152, 62.936848, 0);
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

                assertResult(request, 113.528983, 17.562463, 68.908554);
            });

            it('returns real-gas staged pressures for 21/35 from O2, He and air', () => {
                const request = createEmptyRequest();
                request.target.he = 0.35;

                const result = GasBlender.mix(request);

                expect(result.addHe).toBeCloseTo(68.908554, 6);
                expect(result.addO2).toBeCloseTo(17.562463, 6);
                expect(result.addTop).toBeCloseTo(113.528983, 6);
            });

            it('18/45 using O2, he and Ean32 to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.18;
                request.target.he = 0.45;
                request.topMix.o2 = 0.32;

                assertResult(request, 110.044592, 1.1123, 88.843109);
            });

            it('21/35 using 23/25 to empty tank', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.21;
                request.target.he = 0.35;
                request.topMix.o2 = 0.23;
                request.topMix.he = 0.25;

                assertResult(request, 170.355755, 2.917116, 26.727129);
            });

            it('35/25 using 25/25', () => {
                const request = createEmptyRequest();
                request.target.o2 = 0.35;
                request.target.he = 0.25;
                request.topMix.o2 = 0.25;
                request.topMix.he = 0.25;

                assertResult(request, 161.706712, 28.557179, 9.736109);
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

                    assertResult(request, 149.999999, 0, 0);
                });

                it('21/35 from 21/35 using O2, he and air', () => {
                    const request = createNonEmptyRequest();
                    request.source.o2 = 0.21;
                    request.source.he = 0.35;
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;

                    assertResult(request, 84.942303, 12.958467, 52.09923);
                });

                it('18/45 from 21/35 using 25/25', () => {
                    const request = createNonEmptyRequest();
                    request.source.o2 = 0.25;
                    request.source.he = 0.25;
                    request.target.o2 = 0.18;
                    request.target.he = 0.45;
                    request.topMix.o2 = 0.21;
                    request.topMix.he = 0.25;

                    assertResult(request, 91.154479, 4.0156, 54.829921);
                });
            });

            describe('from air', () => {
                it('18/45 using O2, he and Ean32', () => {
                    const request = createNonEmptyRequest();
                    request.target.o2 = 0.18;
                    request.target.he = 0.45;
                    request.topMix.o2 = 0.32;

                    assertResult(request, 48.84256, 9.386277, 91.771163);
                });

                it('21/35 using 23/25', () => {
                    const request = createNonEmptyRequest();
                    request.target.o2 = 0.21;
                    request.target.he = 0.35;
                    request.topMix.o2 = 0.23;
                    request.topMix.he = 0.25;

                    assertResult(request, 92.327648, 9.825635, 47.846717);
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

            assertResult(request, 0, 19.20533, 180.79467);
        });

        it('Create 5/95 without top mix to non empty tank', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.10;
            request.source.he = 0.90;
            request.target.o2 = 0.05;
            request.target.he = 0.95;
            request.topMix.o2 = 0.25;
            request.topMix.he = 0.25;

            assertResult(request, 0, 4.472772, 145.527228);
        });

        it('Can`t create trimix from mix with nitrox in empty tank', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.10;
            request.source.he = 0.70;
            request.target.o2 = 0.1;
            request.target.he = 0.9;
            request.topMix.o2 = 0.25;
            request.topMix.he = 0.25;

            assertResult(request, 0, 19.20533, 180.79467, 50);
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

            assertResult(request, 0, 53.886666, 0, 53.886666);
        });

        it('converts a normal-volume vent to its real-gas pressure drop', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.32;
            request.source.pressure = 200;
            request.target.o2 = 0.5;
            request.topMix.o2 = 0.21;

            const result = GasBlender.mix(request);

            expect(result.removeFromSource).toBeCloseTo(53.886666, 6);
            expect(result.addHe).toBeCloseTo(0, 6);
            expect(result.addTop).toBeCloseTo(0, 6);
            expect(result.addO2).toBeCloseTo(53.886666, 6);
        });

        it('Trimix 21/25 from 21/35 needs to remove helium', () => {
            const request = createNonEmptyRequest();
            request.source.he = 0.35;
            request.source.pressure = 200;
            request.target.he = 0.25;
            request.topMix.he = 0;

            assertResult(request, 60.31164, 0, 0, 60.311639);
        });

        it('Ean32 from Ean50 needs to remove oxygen', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.5;
            request.source.pressure = 200;
            request.target.o2 = 0.32;

            assertResult(request, 127.416352, 0, 0, 127.416352);
        });

        it('Trimix 15/30 from 25/35 needs to remove everything', () => {
            const request = createNonEmptyRequest();
            request.source.o2 = 0.25;
            request.source.he = 0.35;
            request.source.pressure = 100;
            request.target.o2 = 0.15;
            request.target.he = 0.30;

            assertResult(request, 138.140699, 0, 56.841368, 94.982067);
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
