import { Diver} from './Diver';
import { Tank} from './gases/Tanks';

describe('Diver', () => {
    describe('Create', () => {
        it('Assigns given values', () => {
            const diver = new Diver(25, 26);
            expect(diver.rmv).toBe(25);
            expect(diver.stressRmv).toBe(26);
        });

        it('Assigns default rmv and stressRmv', () => {
            const diver = new Diver();
            expect(diver.rmv).toBe(20);
            expect(diver.stressRmv).toBe(30);
        });

        it('Assigns default stress rmv only', () => {
            const diver = new Diver(18);
            expect(diver.rmv).toBe(18);
            expect(diver.stressRmv).toBe(27);
        });
    });

    it('applies rmv and stressRmv', () => {
        const diver = new Diver(20, 30);
        diver.rmv = 25;
        diver.stressRmv = 35;
        expect(diver.rmv).toBe(25);
        expect(diver.stressRmv).toBe(35);
    });

    it('calculates teamStressRmv from stressRmv', () =>{
        const diver = new Diver(20, 24);
        expect(diver.teamStressRmv).toBe(48);
    });

    it('calculates gas SAC based on tank size', () => {
        const diver = new Diver(12);
        const tank = new Tank(10, 200, 21);
        expect(diver.gasSac(tank)).toBe(1.2);
    });

    it('loadFrom should correctly copy values', () => {
        const diver1 = new Diver(22, 45);
        const diver2 = new Diver();
        diver2.loadFrom(diver1);
        expect(diver2.rmv).toBe(22);
        expect(diver2.stressRmv).toBe(45);
    });
});


