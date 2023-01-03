import { GasDensity } from './GasDensity';

describe('Gas Density at 1 ATA', () => {
    const sut = new GasDensity();

    it('Air density is 1.28817', () => {
        const density = sut.forGas(.21, 0);
        expect(density).toBeCloseTo(1.28817, 5);
    });

    it('Ean32 density is 1.30764', () => {
        const density = sut.forGas(.32, 0);
        expect(density).toBeCloseTo(1.30764, 5);
    });

    it('Oxygen density is 1.428', () => {
        const density = sut.forGas(1, 0);
        expect(density).toBeCloseTo(1.428, 5);
    });

    it('Trimix  18/45 density is 0.80046', () => {
        const density = sut.forGas(.18, .45);
        expect(density).toBeCloseTo(0.80046, 5);
    });
});
