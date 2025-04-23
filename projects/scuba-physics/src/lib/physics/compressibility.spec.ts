import { Compressibility } from "./compressibility";
import { StandardGases } from "../gases/StandardGases";
import { Gas } from "../gases/Gases";

describe('Gas compressibility', () => {
    const sut = new Compressibility();

    describe('Normal volume', () => {
        it('200 b of Trimix 25/25 is 192.05 L', () => {
            const gas = StandardGases.trimix2525;
            const result = sut.normalVolume(200, gas);
            expect(result).toBeCloseTo(192.05390841, 8);
        });

        it('50 b of Air is 50.4 L', () => {
            const gas = StandardGases.air;
            const result = sut.normalVolume(50, gas);
            expect(result).toBeCloseTo(50.44588538, 8);
        });

        it('100 b of Helium is 95.5 L', () => {
            const gas = new Gas(0, 1);
            const result = sut.normalVolume(100, gas);
            expect(result).toBeCloseTo(95.47529425, 8);
        });

        it('1 b of Air is 1 L', () => {
            const gas = StandardGases.air;
            const result = sut.normalVolume(1, gas);
            expect(result).toBeCloseTo(1, 8);
        });
    });

    describe('Pressure', () => {
        it('192.054 L of Trimix 25/25 is at 200 b', () => {
            const gas = StandardGases.trimix2525;
            const result = sut.pressure(gas, 192.05390841);
            expect(result).toBeCloseTo(200, 5);
        });

        it('50.45 L of Air is at 50 b', () => {
            const gas = StandardGases.air;
            const result = sut.pressure(gas, 50.44588538);
            expect(result).toBeCloseTo(50, 7);
        });

        it('95.5 L of Helium is at 100 b', () => {
            const gas = new Gas(0, 1);
            const result = sut.pressure(gas, 95.47529425);
            expect(result).toBeCloseTo(100, 5);
        });

        it('1 L of Air is at 1 b', () => {
            const gas = StandardGases.air;
            const result = sut.pressure(gas, 1);
            expect(result).toBeCloseTo(1, 8);
        });

        it('Maximum volume 750 L for Air', () => {
            const gas = StandardGases.air;
            expect(() => sut.pressure(gas, 751)).toThrow();
        });
    });

    describe('Z-factor', () => {
        const zFactor = (gas: Gas)=> sut.zFactor(207, gas);

        it('Air at 207 b is 1.04', () => {
            const result = zFactor(StandardGases.air);
            expect(result).toBeCloseTo(1.04017669, 8);
        });

        it('Oxygen at 207 b is 0.96', () => {
            const result = zFactor(StandardGases.oxygen);
            expect(result).toBeCloseTo(0.95879556, 8);
        });

        it('Helium at 207 b is 1.098', () => {
            const result = zFactor(new Gas(0, 1));
            expect(result).toBeCloseTo(1.09756199, 8);
        });

        it('Trimix at 207 b 18/45 is 1.06', () => {
            const result = zFactor(StandardGases.trimix1845);
            expect(result).toBeCloseTo(1.05930748, 8);
        });

        it('Trimix 18/45 at 232 b is 1.06', () => {
            const gas = StandardGases.trimix1845;
            const result = sut.zFactor(232, gas);
            expect(result).toBeCloseTo(1.07288297, 8);
        });
    });

    describe('Tank volume', () => {
        const tank = { size: 10, startPressure: 200 };

        it('10 l of Air at 200 b is 1928 l', () => {
            const result = sut.tankVolume(tank, StandardGases.air);
            expect(result).toBeCloseTo(1928.651, 3);
        });

        it('10 l of Oxygen at 200 b is 2088 l', () => {
            const result = sut.tankVolume(tank, StandardGases.oxygen);
            expect(result).toBeCloseTo(2088.087, 3);
        });

        it('10 l of Trimix 18/45 at 200 b is 1893', () => {
            const result = sut.tankVolume(tank, StandardGases.trimix1845);
            expect(result).toBeCloseTo(1893.038, 3);
        });

        it('20 l of air at 200 b is 3857 l', () => {
            const tank20 = { size: 20, startPressure: 200 };
            const result = sut.tankVolume(tank20, StandardGases.air);
            expect(result).toBeCloseTo(3857.303, 3);
        });

        it('10 l of air at 50 b is 505', () => {
            const tank50b = { size: 10, startPressure: 50 };
            const result = sut.tankVolume(tank50b, StandardGases.air);
            expect(result).toBeCloseTo(504.571, 3);
        });
    });

    describe('Tank pressure', () => {
        it('1928 l in 10 l tank of Air is 200 b', () => {
            const result = sut.tankPressure(StandardGases.air, 10, 1928.651);
            expect(result).toBeCloseTo(200, 3);
        });

        it('2088 l in 10 l tank of Oxygen is 200 b', () => {
            const result = sut.tankPressure(StandardGases.oxygen, 10, 2088.087);
            expect(result).toBeCloseTo(200, 3);
        });

        it('1894 l in 10 l tank of Trimix 18/45 is 200 b', () => {
            const result = sut.tankPressure(StandardGases.trimix1845, 10, 1893.038);
            expect(result).toBeCloseTo(200, 3);
        });

        it(' 3861 l in 20 l tank of air is 200 b', () => {
            const result = sut.tankPressure(StandardGases.air, 20, 3857.303);
            expect(result).toBeCloseTo(200, 3);
        });

        it('505 l in 10 l tank of air is 50 b', () => {
            const result = sut.tankPressure(StandardGases.air, 10, 504.571);
            expect(result).toBeCloseTo(50, 3);
        });
    });
});
