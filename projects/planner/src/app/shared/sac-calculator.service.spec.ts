import { SacCalculatorService } from './sac-calculator.service';

describe('SacCalculatorService', () => {
    let service: SacCalculatorService;
    beforeEach(() => {
        service = new SacCalculatorService();
    });

    describe('RMV/Sac calculations', () => {
        it('15m for 45 min with 15L tank (defaults) has sac 20 L/min.', () => {
            expect(service.rmv).toBe(20);
        });

        it('15m for 60 min with 15L tank has sac 15 L/min.', () => {
            service.duration = 60;
            expect(service.rmv).toBe(15);
        });

        it('at 0 m calculates 50 L/min.', () => {
            service.depth = 0;
            expect(service.rmv).toBe(50);
        });

        it('0 bar consumed has SAC 0 L/min.', () => {
            service.used = 0;
            expect(service.rmv).toBe(0);
        });

        it('0 L large tank has SAC 0 L/min.', () => {
            service.tankSize = 0;
            expect(service.rmv).toBe(0);
        });

        it('for 0 min has infinite SAC', () => {
            service.duration = 0;
            expect(service.rmv).toBe(Infinity);
        });
    });

    describe('Duration calculations', () => {
        it('15m with 15L tank (defaults) with sac 20.24 L/min. holds 45 minutes.', () => {
            service.toDuration();
            service.rmv = 20;
            expect(service.duration).toBe(45);
        });
    });

    describe('Used bars calculations', () => {
        it('15m for 45 min with 15L tank (defaults) with sac 20 L/min. consumes 150 bar.', () => {
            service.toUsed();
            service.rmv = 20;
            expect(service.used).toBe(150);
        });
    });
});
