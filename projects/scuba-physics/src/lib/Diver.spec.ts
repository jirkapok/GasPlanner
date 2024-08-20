import { Diver} from './Diver';
import { Tank} from './Tanks';

// eslint-disable-next-line jasmine/no-focused-tests
fdescribe('Diver', () => {

    it('Diver.rmv', () => {
        const diver = new Diver(20, 25);
        expect(diver.rmv).toBe(20);
    });

    it('Diver.stressRmv', () => {
        const diver = new Diver(20, 30);
        expect(diver.stressRmv).toBe(30);
    });

    it('should correctly change rmv and stressRmv', () => {
        const diver = new Diver(20, 30);
        diver.rmv = 25;
        diver.stressRmv = 35;
        expect(diver.rmv).toBe(25);
        expect(diver.stressRmv).toBe(35);
    });

    it('should correctly assign default rmv and stressRmv if undefined', () => {
        const diver = new Diver(undefined, undefined);
        expect(diver.rmv).toBe(Diver.defaultSac);
        expect(diver.stressRmv).toBe(Diver.defaultSac * 1.5);
    });

    it('constructor with default values', () => {
        const diver = new Diver();
        expect(diver.rmv).toBe(Diver.defaultSac);
        expect(diver.stressRmv).toBe(Diver.defaultSac * 1.5);
    });

    it('constructor with rmv defined only ', () => {
        const diver = new Diver(18);
        expect(diver.rmv).toBe(18);
        expect(diver.stressRmv).toBe(18 * 1.5);
    });

    it('constructor with defined values ', () => {
        const diver = new Diver(30,50);
        expect(diver.rmv).toBe(30);
        expect(diver.stressRmv).toBe(50);
    });

    it('should correctly calculate teamStressRmv', () =>{
        const stressRmv = 30;
        const diver = new Diver(20, stressRmv);
        expect(diver.teamStressRmv).toBe(60);
    });

    it('should correctly calculate gas SAC based on tank size', () => {
        const diver = new Diver (20, 30);
        const tank = new Tank(100, 100, 20);
        tank.size = 100;
        expect(diver.gasSac(tank)).toBe(0.2);
    });

    it('should correctly calculate gas SAC based on instance properties', () => {
        const diver = new Diver();
        const tank = new Tank(100, 100, 20);
        expect(diver.gasSac(tank)).toBe(0.2);
    });

    it('should correctly pass values from Diver instance', () => {
        const diver1 = new Diver(30, 45);
        const diver2 = new Diver();
        diver2.loadFrom(diver1);
        expect(diver2.rmv).toBe(30);
        expect(diver2.stressRmv).toBe(45);
    });

});


