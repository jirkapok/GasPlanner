import { Compressibility } from "./compressibility";
import { StandardGases } from "../gases/StandardGases";
import { Gas } from "../gases/Gases";

describe('Gas compressibility', () => {
    const sut = new Compressibility();

    describe('Normal volume', () => {
        it('200 b of Trimix 25/25 is 192.054 L', () => {
            const gas = StandardGases.trimix2525.copy();
            const result = sut.normalVolumeFactor(200, gas);
            expect(result).toBeCloseTo(192.05390841, 8);
        });

        it('50 b of Air is 192.054 L', () => {
            const gas = StandardGases.air.copy();
            const result = sut.normalVolumeFactor(50, gas);
            expect(result).toBeCloseTo(50.44588538, 8);
        });

        it('100 b of Helium is 192.054 L', () => {
            const gas = new Gas(0, 1).copy();
            const result = sut.normalVolumeFactor(50, gas);
            expect(result).toBeCloseTo(48.84467671, 8);
        });

        it('1 b of Air is 1 L', () => {
            const gas = StandardGases.air.copy();
            const result = sut.normalVolumeFactor(1, gas);
            expect(result).toBeCloseTo(1, 8);
        });
    });
});
