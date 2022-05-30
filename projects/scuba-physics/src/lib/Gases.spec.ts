import { Gases, Gas, GasesValidator, GasMixtures, GasOptions, BestGasOptions, StandardGases } from './Gases';
import { DepthConverter } from './depth-converter';
import { DepthLevels } from './DepthLevels';
import { SafetyStop } from './Options';

describe('Gases', () => {
    const options: GasOptions = {
        maxPpO2: 1.4,
        maxDecoPpO2: 1.6,
        maxEND: 30
    };

    const freshWaterConverter = DepthConverter.forFreshWater();
    const levelOptions = {
        lastStopDepth: 6,
        safetyStop: SafetyStop.never,
        decoStopDistance: 3,
        minimumAutoStopDepth: 10
    };
    const depthLevels = new DepthLevels(freshWaterConverter, levelOptions);

    describe('Gas', () => {
        describe('Maximum operational depth', () => {
            const ppO2 = 1.4;

            it('Oxygen with ppO2 1.6 is 6m', () => {
                const mod = StandardGases.oxygen.mod(1.6);
                expect(mod).toBeCloseTo(1.6, 2);
            });

            it('Air for ppO 1.4 is 57 m', () => {
                let mod = StandardGases.air.mod(ppO2);
                mod = Math.round(mod * 100) / 100;
                expect(mod).toBeCloseTo(6.7, 2);
            });
        });

        describe('END - Only Nitrogen narcotic', () => {
            it('8 m in fresh water for Trimix 10/70', () => {
                const end = StandardGases.trimix1070.end(4, false);
                expect(end).toBeCloseTo(0.8, 2);
            });

            it('4.8 m with 18/45 trimix', () => {
                const end = StandardGases.trimix1845.end(4, false);
                expect(end).toBeCloseTo(1.48, 2);
            });

            it('10 m with Ean50', () => {
                const end = StandardGases.ean50.end(4, false);
                expect(end).toBeCloseTo(2, 2);
            });
        });

        describe('END - Oxygen narcotic', () => {
            it('2 m in fresh water for Trimix 10/70', () => {
                const end = StandardGases.trimix1070.end(4, true);
                expect(end).toBeCloseTo(1.2, 2);
            });

            it('12 m with 18/45 trimix', () => {
                const end = StandardGases.trimix1845.end(4, true);
                expect(end).toBeCloseTo(2.2, 2);
            });

            it('30 m with Ean50', () => {
                const end = StandardGases.ean50.end(4, true);
                expect(end).toBeCloseTo(4, 2);
            });
        });

        describe('MND - Only Nitrogen narcotic', () => {
            it('30 m in fresh water for Trimix 10/70', () => {
                const end = StandardGases.trimix1070.mnd(0.8, false);
                expect(end).toBeCloseTo(4, 2);
            });

            it('30 m with 18/45 trimix', () => {
                const end = StandardGases.trimix1845.mnd(1.48, false);
                expect(end).toBeCloseTo(4, 2);
            });

            it('21 m with Ean50', () => {
                const end = StandardGases.ean50.mnd(2, false);
                expect(end).toBeCloseTo(4, 2);
            });
        });

        describe('MND - Oxygen narcotic', () => {
            it('30 m for 2 m in fresh water for Trimix 10/70', () => {
                const end = StandardGases.trimix1070.mnd(1.2, true);
                expect(end).toBeCloseTo(4, 2);
            });

            it('30m for 12 m with 18/45 trimix', () => {
                const end = StandardGases.trimix1845.mnd(2.2, true);
                expect(end).toBeCloseTo(4, 2);
            });

            it('30 m for 30 m with Ean50', () => {
                const end = StandardGases.ean50.mnd(4, true);
                expect(end).toBeCloseTo(4, 2);
            });
        });

        describe('Ceiling', () => {
            it('Hyperoxic nitrox 50% in fresh water to 0 m', () => {
                const ceiling = StandardGases.ean50.ceiling(freshWaterConverter.surfacePressure);
                expect(ceiling).toBe(freshWaterConverter.surfacePressure);
            });

            it('Air in fresh water to 0 m', () => {
                const ceiling = StandardGases.air.ceiling(freshWaterConverter.surfacePressure);
                expect(ceiling).toBe(freshWaterConverter.surfacePressure);
            });

            it('Hypoxic Trimix 10/70 in fresh water to 8 m', () => {
                let ceiling = StandardGases.trimix1070.ceiling(freshWaterConverter.surfacePressure);
                ceiling = Math.round(ceiling * 100) / 100;
                expect(ceiling).toBeCloseTo(1.82, 2);
            });
        });

        describe('Content O2 + He can\'t exceed 100 %', () => {
            it('Throws exception, when crating new instance', () => {
                expect(() => new Gas(0.8, 0.5)).toThrowError();
            });

            it('When changing O2', () => {
                const sut = new Gas(0.5, 0.5);
                sut.fO2 = 0.8;
                expect(sut.fHe).toBe(0.2);
            });

            it('When changing He', () => {
                const sut = new Gas(0.5, 0.5);
                sut.fHe = 0.8;
                expect(sut.fO2).toBe(0.2);
            });

            it('O2 itself cant exceed 100%', () => {
                const sut = new Gas(0.5, 0.5);
                sut.fO2 = 1.8;
                expect(sut.fO2).toBe(1);
                expect(sut.fHe).toBe(0);
            });

            it('He itself cant exceed 99% event it doesn\'t matter', () => {
                const sut = new Gas(0.5, 0.5);
                sut.fHe = 1.8;
                expect(sut.fO2).toBe(0.01);
                expect(sut.fHe).toBe(0.99);
            });
        });
    });

    describe('Standard gases', () => {
        describe('Find name by fractions', () => {
            it('Air', () => {
                const found = StandardGases.nameFor(.21);
                expect(found).toBe('Air');
            });

            it('EAN32', () => {
                const found = StandardGases.nameFor(.32);
                expect(found).toBe('EAN32');
            });

            it('Name Oxygen', () => {
                const found = StandardGases.nameFor(1);
                expect(found).toBe('Oxygen');
            });

            it('Trimix 10/70', () => {
                const found = StandardGases.nameFor(0.1, 0.7);
                expect(found).toBe('Trimix 10/70');
            });

            it('Helitrox 21/35', () => {
                const found = StandardGases.nameFor(0.21, 0.35);
                expect(found).toBe('Helitrox 21/35');
            });

            it('0% oxygen = empty name', () => {
                const found = StandardGases.nameFor(0);
                expect(found).toBe('');
            });

            it('Trimix 0% oxygen = empty name', () => {
                const found = StandardGases.nameFor(0, 70);
                expect(found).toBe('');
            });
        });

        describe('By name', () => {
            it('Oxygen', () => {
                const found = StandardGases.byName('Oxygen');
                expect(found).toEqual(StandardGases.oxygen);
            });

            it('Ean32', () => {
                const found = StandardGases.byName('EAN32');
                expect(found).toEqual(StandardGases.ean32);
            });

            it('Non standard Ean28', () => {
                const found = StandardGases.byName('EAN28');
                expect(found).toEqual(new Gas(.28, 0));
            });

            it('Name Air', () => {
                const found = StandardGases.byName('Air');
                expect(found).toEqual(StandardGases.air);
            });

            it('Name Trimix 10/70', () => {
                const found = StandardGases.byName('10/70');
                expect(found).toEqual(StandardGases.trimix1070);
            });

            it('Name 10/70', () => {
                const found = StandardGases.byName('10/70');
                expect(found).toEqual(StandardGases.trimix1070);
            });

            it('Ean00', () => {
                const found = StandardGases.byName('Ean00');
                expect(found).toBeNull();
            });

            it('00/00', () => {
                const found = StandardGases.byName('00/00');
                expect(found).toBeNull();
            });

            it('Empty name = no gas', () => {
                const found = StandardGases.byName('');
                expect(found).toBeNull();
            });

            it('Unknown name = no gas', () => {
                const found = StandardGases.byName('unknonwname');
                expect(found).toBeNull();
            });
        });
    });

    describe('Collection', () => {
        let gases: Gases;

        beforeEach(() => {
            gases = new Gases();
        });

        describe('Is Registered', () => {
            it('Gas as bottom gas is registered', () => {
                gases.add(StandardGases.air);
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeTrue();
            });

            it('No gases, gas is not registered', () => {
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeFalse();
            });
        });

        describe('Best gas', () => {
            const bestGasOptions: BestGasOptions = {
                currentDepth: 0,
                maxDecoPpO2: options.maxDecoPpO2,
                maxEndPressure: 4,
                oxygenNarcotic: true,
                currentGas: StandardGases.air
            };

            beforeEach(() => {
                bestGasOptions.currentGas = StandardGases.air;
            });

            it('The only deco gas is found', () => {
                gases.add(StandardGases.air);
                gases.add(StandardGases.ean50);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.ean50);
            });

            it('No deco gas, bottom gas is found', () => {
                gases.add(StandardGases.air);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.air);
            });

            it('Multiple deco gases, best is found', () => {
                gases.add(StandardGases.air);
                gases.add(StandardGases.ean50);
                gases.add(StandardGases.trimix1845);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.ean50);
            });

            it('Finds non hypoxic mixture', () => {
                gases.add(StandardGases.trimix1070);
                gases.add(StandardGases.trimix1845);
                bestGasOptions.currentDepth = 3;
                bestGasOptions.currentGas = StandardGases.trimix1070;
                const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.trimix1845);
            });

            describe('By content', () => {
                beforeEach(() => {
                    gases.add(StandardGases.air);
                    gases.add(StandardGases.ean50);
                    gases.add(StandardGases.trimix1845);
                    gases.add(StandardGases.trimix1070);
                    gases.add(StandardGases.oxygen);
                });

                it('Oxygen for 6m', () => {
                    bestGasOptions.currentDepth = 6;
                    const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.oxygen);
                });

                it('Air for 30m', () => {
                    bestGasOptions.currentDepth = 30;
                    const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.air);
                });

                it('Trimix 18/45 for 40m', () => {
                    bestGasOptions.currentDepth = 40;
                    bestGasOptions.currentGas = new Gas(0, 0);
                    const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.trimix1845);
                });

                // Yes, because we want to offgas both He and N2 fractions, so only oxygen matters
                it('Air is better than trimix 18/45 for 40m', () => {
                    bestGasOptions.currentDepth = 40;
                    const found = gases.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.air);
                });

                it('Current ean32 is better than air for 30m', () => {
                    bestGasOptions.currentDepth = 30;
                    const gases2 = new Gases();
                    const ean32 = new Gas(.32, 0);
                    gases2.add(ean32);
                    gases2.add(StandardGases.air);
                    const found = gases2.bestGas(depthLevels, freshWaterConverter, bestGasOptions);
                    expect(found).toBe(ean32);
                });
            });
        });
    });

    describe('Validator', () => {
        const surfacePressure = freshWaterConverter.surfacePressure;
        it('No gas defined', () => {
            const messages = GasesValidator.validate(new Gases(), options, surfacePressure);
            expect(messages.length).toBe(1);
        });
    });

    describe('Gas partial pressures', () => {
        it('At 1 bar 0.79 volume fraction converts to ', () => {
            const result = GasMixtures.partialPressure(1, 0.79);
            expect(result).toBe(0.79);
        });

        it('At 3 bar 0.79 volume fraction converts to ', () => {
            const result = GasMixtures.partialPressure(6.667, 0.21);
            expect(result).toBeCloseTo(1.40, 3);
        });

        it('At 0 bars any fraction results in 0 partial pressure', () => {
            const result = GasMixtures.partialPressure(0, 0.79);
            expect(result).toBe(0);
        });

        it('At any bars 0 fraction results in 0 partial pressure', () => {
            const result = GasMixtures.partialPressure(3, 0);
            expect(result).toBe(0);
        });
    });

    describe('Gas composition equality', () => {
        it('Equals to the same content of oxygen and helium returns true', () => {
            const other = new Gas(StandardGases.o2InAir, 0);
            expect(StandardGases.air.compositionEquals(other)).toBeTruthy();
        });

        it('Equals to different helium content returns false', () => {
            const other = new Gas(StandardGases.o2InAir, .2);
            expect(StandardGases.air.compositionEquals(other)).toBeFalsy();
        });

        it('Equals to different oxygen content returns false', () => {
            expect(StandardGases.air.compositionEquals(StandardGases.ean50)).toBeFalsy();
        });
    });
});
