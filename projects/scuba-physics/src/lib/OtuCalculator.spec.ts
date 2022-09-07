import { OtuCalculator } from './OtuCalculator';

describe('OtuCalculatorService', () => {
    const otuCalculator = new OtuCalculator();

    describe('Flat - depth does not change', () => {
        it('should get OTU 38,6762 for 22min at 1,484 ppO2', () => {
            const otu = otuCalculator.calculateFlat(22.0, 1.484);
            expect(otu).toBe(38.676181761978775);
        });

        it('should get OTU 38,5818 for 20min at 1,6 ppO2', () => {
            const otu = otuCalculator.calculateFlat(20.0, 1.6);
            expect(otu).toBe(38.58177728187526);
        });

        it('should get OTU 28,9712 for 20min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculateFlatWithDepth(20.0, .32, 30.0);
            expect(otu).toBe(28.971245142600388);
        });
    });

    describe('Difference - depth does change', () => {
        it('should get OTU 2,4026 for 3min with EAN32 from 0m to 36m', () => {
            const otu = otuCalculator.calculateDifference(3.0, .32, .0, 36.0);
            expect(otu).toBe(2.4025576802454425);
        });

        it('should get OTU 24,0256 for 30min with EAN32 from 36m to 0m', () => {
            const otu = otuCalculator.calculateDifference(30.0, .32, 36.0, .0);
            expect(otu).toBe(24.02557680245443);
        });
    });
});
