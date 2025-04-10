import {RedundanciesService} from './redundancies.service';
import {UnitConversion} from './UnitConversion';

describe('Redundancies service', () => {
    it('Calculates final pressure', () => {
        const sut = new RedundanciesService(new UnitConversion());
        sut.firstTank.startPressure = 100;
        expect(sut.finalPressure).toBeCloseTo(148.2 , 1);
    });

    it('Calculates Imperial final pressure', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const sut = new RedundanciesService(units);
        sut.firstTank.startPressure = 1000;
        sut.secondTank.startPressure = 3000;
        expect(sut.finalPressure).toBeCloseTo(1955.7, 1);
    });
});
