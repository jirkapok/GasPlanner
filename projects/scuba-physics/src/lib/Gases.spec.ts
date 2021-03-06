import { Gases, Gas, GasesValidator, GasMixtures, GasOptions, BestGasOptions, StandardGases } from './Gases';
import { DepthConverter } from './depth-converter';

describe('Gases', () => {
    const options: GasOptions = {
        maxPpO2: 1.4,
        maxDecoPpO2: 1.6,
        maxEND: 30
    };

    const freshWaterConverter = DepthConverter.forFreshWater();

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

        describe('Narcotic depth', () => {
            it('0 m in fresh water for Trimix 10/70', () => {
                const end = StandardGases.trimix1070.end(1.6);
                expect(end).toBeCloseTo(0.48, 2);
            });

            it('60 m with 18/35 trimix', () => {
                const end = StandardGases.trimix1835.end(7);
                expect(end).toBeCloseTo(4.55, 2);
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

            it('Hypooxic Trimix 10/70 in fresh water to 8 m', () => {
                let ceiling = StandardGases.trimix1070.ceiling(freshWaterConverter.surfacePressure);
                ceiling = Math.round(ceiling * 100) / 100;
                expect(ceiling).toBeCloseTo(1.82, 2);
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

            it('Oxygen', () => {
                const found = StandardGases.nameFor(1);
                expect(found).toBe('Oxygen');
            });

            it('Trimix 10/70', () => {
                const found = StandardGases.nameFor(0.1, 0.7);
                expect(found).toBe('10/70');
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

            it('Air', () => {
                const found = StandardGases.byName('Air');
                expect(found).toEqual(StandardGases.air);
            });

            it('Trimix 10/70', () => {
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

    describe('Gases', () => {
        describe('Is Registered', () => {
            it('Gas as bottom gas is registered', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeTrue();
            });

            it('Gas as deco, gas is registered', () => {
                const gases = new Gases();
                gases.addDecoGas(StandardGases.air);
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeTrue();
            });

            it('No gases, gas is not registered', () => {
                const gases = new Gases();
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeFalse();
            });

            it('Gas is not registered', () => {
                const gases = new Gases();
                gases.addDecoGas(StandardGases.ean50);
                const registered = gases.isRegistered(StandardGases.air);
                expect(registered).toBeFalse();
            });
        });

        describe('Best gas', () => {
            const bestGasOptions: BestGasOptions = {
                currentDepth: 0,
                maxDecoPpO2: options.maxDecoPpO2,
                maxEndPressure: 4,
                currentGas: StandardGases.air
            };

            beforeEach(() => {
                bestGasOptions.currentGas = StandardGases.air;
            });

            it('The only deco gas is found', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addDecoGas(StandardGases.ean50);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.ean50);
            });

            it('No deco gas, bottom gas is found', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.air);
            });

            it('Multiple deco gases, best is found', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addDecoGas(StandardGases.ean50);
                gases.addDecoGas(StandardGases.trimix1835);
                bestGasOptions.currentDepth = 20;
                const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                expect(found).toBe(StandardGases.ean50);
            });

            describe('By content', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addBottomGas(StandardGases.ean50);
                gases.addBottomGas(StandardGases.trimix1835);
                gases.addBottomGas(StandardGases.trimix1070);
                gases.addBottomGas(StandardGases.oxygen);

                it('Oxygen for 6m', () => {
                    bestGasOptions.currentDepth = 6;
                    const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.oxygen);
                });

                it('Air for 30m', () => {
                    bestGasOptions.currentDepth = 30;
                    const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.air);
                });

                it('Trimix 18/35 for 40m', () => {
                    bestGasOptions.currentDepth = 40;
                    bestGasOptions.currentGas = new Gas(0, 0);
                    const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.trimix1835);
                });

                it('Air is better than trimix 18/35 for 40m', () => {
                    bestGasOptions.currentDepth = 40;
                    const found = gases.bestDecoGas(freshWaterConverter, bestGasOptions);
                    expect(found).toBe(StandardGases.air);
                });

                it('Current ean32 is better than best deco air for 30m', () => {
                    bestGasOptions.currentDepth = 30;
                    const gases2 = new Gases();
                    const ean32 = new Gas(.32, 0);
                    gases2.addBottomGas(ean32);
                    gases2.addDecoGas(StandardGases.air);
                    const found = gases2.bestDecoGas(freshWaterConverter, bestGasOptions);
                    expect(found).toBe(ean32);
                });
            });
        });
    });

    describe('Gases validator', () => {
        const surfacePressure = freshWaterConverter.surfacePressure;
        it('No gas defined', () => {
            const messages = GasesValidator.validate(new Gases(), options, surfacePressure);
            expect(messages.length).toBe(1);
        });

        it('Only one gas', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);
            const messages = GasesValidator.validate(gases, options, surfacePressure);
            expect(messages.length).toBe(0);
        });

        it('No gas to surface', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.trimix1070);
            const messages = GasesValidator.validate(gases, options, surfacePressure);
            expect(messages.length).toBe(0);
        });

        it('Gases don`t cover all depths', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.trimix1070);
            gases.addDecoGas(StandardGases.oxygen);
            const messages = GasesValidator.validate(gases, options, surfacePressure);
            expect(messages.length).toBe(1);
        });

        it('Multiple gases for the same depth', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);
            gases.addDecoGas(StandardGases.ean50);
            const messages = GasesValidator.validate(gases, options, surfacePressure);
            expect(messages.length).toBe(0);
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
