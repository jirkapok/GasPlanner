import { OtuCalculator } from './OtuCalculator';

describe('OtuCalculatorService', () => {
    const otuCalculator = new OtuCalculator();

    describe('Flat - depth does not change', () => {
        it('0 OTU for 0 min at 0 ppO2', () => {
            const otu = otuCalculator.calculateFlat(0, 0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 22 min at .4 ppO2', () => {
            const otu = otuCalculator.calculateFlat(22.0, .4);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min at .4 ppO2', () => {
            const otu = otuCalculator.calculateFlat(0, 1);
            expect(otu).toBe(0);
        });

        it('38.6762 OTU for 22min at 1.484 ppO2', () => {
            const otu = otuCalculator.calculateFlat(22.0, 1.484);
            expect(otu).toBe(38.676181761978775);
        });

        it('38.5818 OTU for 20 min at 1.6 ppO2', () => {
            const otu = otuCalculator.calculateFlat(20.0, 1.6);
            expect(otu).toBe(38.58177728187526);
        });

        it('28.9712 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculateFlatWithDepth(20.0, .32, 30.0);
            expect(otu).toBe(28.971245142600388);
        });
    });

    describe('Difference - depth does change', () => {
        it('0 OTU for 20 min with 0 pO2 in 30 metres', () => {
            const otu = otuCalculator.calculateDifference(20, 0, 20.0, 30.0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculateDifference(0, .32, 20.0, 30.0);
            expect(otu).toBe(0);
        });

        it('28.9 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculateDifference(20.0, .32, 30.0, 30.0);
            expect(otu).toBeNaN();
        });

        it('2.4026 OTU for 3 min with EAN32 from 0 m to 36 m', () => {
            const otu = otuCalculator.calculateDifference(3.0, .32, .0, 36.0);
            expect(otu).toBe(2.4025576802454425);
        });

        it('24.0256 OTU for 30 min with EAN32 from 36 m to 0 m', () => {
            const otu = otuCalculator.calculateDifference(30.0, .32, 36.0, .0);
            expect(otu).toBe(24.02557680245443);
        });
    });
});
