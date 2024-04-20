import { OptionsService } from './options.service';
import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { Preferences } from './preferences';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewStates } from './viewStates';
import { ViewSwitchService } from './viewSwitchService';
import { DepthsService } from './depths.service';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';

class TestSut {
    constructor(
        public schedules: DiveSchedules,
        public planner: PlannerService,
        public viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        public urlSerialization: PlanUrlSerialization) {
    }

    public get options(): OptionsService {
        return this.schedules.selectedOptions;
    }

    public get depths(): DepthsService {
        return this.schedules.selectedDepths;
    }

    public get tanksService(): TanksService {
        return this.schedules.selectedTanks;
    }
}

// TODO test cases
// * Load of current dive (Refresh page) - does not add new dive
// * From url - adds new dive
describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();

    // because we need custom instances to compare
    const createSimpleSut = (imperial = false): TestSut => {
        const units = new UnitConversion();
        const dispatcher = new ReloadDispatcher();
        units.imperialUnits = imperial;
        const schedules = new DiveSchedules(units, dispatcher);
        const viewSwitch = new ViewSwitchService(schedules);
        const planner = new PlannerService(schedules, dispatcher, viewSwitch, irrelevantFactory, units);
        const preferences = new Preferences(viewSwitch, units, schedules, new ViewStates());
        const urlSerialization = new PlanUrlSerialization(viewSwitch, units, schedules, preferences);
        const firstDive = schedules.dives[0];
        firstDive.depths.setSimple();
        return new TestSut(schedules, planner, viewSwitch, units,  urlSerialization);
    };

    const createSimplePlan = () => {
        const simpleSut = createSimpleSut();
        simpleSut.tanksService.tanks[0].size = 18;
        simpleSut.planner.calculate(1);
        return simpleSut;
    };

    const createComplexSut = () => {
        const created = createSimpleSut();
        created.viewSwitch.isComplex = true;
        created.tanksService.addTank();
        created.depths.addSegment();
        created.planner.calculate(1);
        return created;
    };

    /** in metric */
    let complexSut: TestSut;
    let simpleViewUrl: string;
    let complexViewUrl: string;

    beforeEach(() => {
        complexSut = createComplexSut();
        complexViewUrl = complexSut.urlSerialization.toUrl();

        const simplePlan = createSimplePlan();
        simpleViewUrl = simplePlan.urlSerialization.toUrl();
    });

    const expectSelectedEquals = (current: TestSut, expected: TestSut): void => {
        const toExpect = {
            plan: expected.depths.segments,
            tanks: expected.tanksService.tankData,
            diver: expected.options.getDiver(),
            options: expected.options.getOptions(),
        };

        const toCompare = {
            plan: current.depths.segments,
            tanks: current.tanksService.tankData,
            diver: current.options.getDiver(),
            options: current.options.getOptions(),
        };

        expect(toCompare).toEqual(toExpect);
    };

    it('Generates valid url characters', () => {
        const isValid = /[-a-zA-Z0-9@:%_+.~#&//=]*/g.test(complexViewUrl);
        expect(isValid).toBeTruthy();
    });

    it('Generates url of selected dive for multiple dives', () => {
        complexSut.schedules.add();
        complexSut.schedules.selected = complexSut.schedules.dives[0];
        const url = complexSut.urlSerialization.toUrl();
        const urlExpected = complexSut.urlSerialization.toUrlFor(complexSut.schedules.dives[0].id);
        expect(urlExpected).toEqual(url);
    });

    it('Serialize application options', () => {
        complexSut.viewSwitch.isComplex = true;
        complexSut.units.imperialUnits = true;
        const url = complexSut.urlSerialization.toUrl();
        expect(url).toContain('ao=1,1');
    });

    it('Decodes url for facebook link', () => {
        const encodedParams = encodeURIComponent(complexViewUrl);
        const current = createSimpleSut();
        current.urlSerialization.fromUrl(encodedParams);
        current.schedules.remove(current.schedules.dives[0]); // because the dive was added
        current.planner.calculate(1);
        expectSelectedEquals(current, complexSut);
    });

    it('Complex plan in imperial units still generates url below 2048 characters', () => {
        const current = createSimpleSut(true);
        // tests the limits of url serialization
        // long enough with precise imperial values, still bellow 2k characters
        // consider rounding the workPressure to 3 digits to shorten,
        // since it leads to not loosing precision on tank size on first 3 decimals
        for (let index = 0; index < 22; index++) {
            current.tanksService.addTank();
            current.depths.addSegment();
        }

        const result = current.urlSerialization.toUrl();
        expect(result.length).toBeLessThan(2048);
    });

    describe('Complex vs. Simple view', () => {
        it('Load complex plan to simple view',() => {
            const current = createSimpleSut();
            current.urlSerialization.fromUrl(complexViewUrl);
            current.planner.calculate(2);
            expectSelectedEquals(current, complexSut);
            expect(current.viewSwitch.isComplex).toBeTruthy();
        });

        it('Load simple plan to simple view', () => {
            const current = createSimpleSut();
            current.urlSerialization.fromUrl(simpleViewUrl);
            current.planner.calculate(2);
            const simpleSut = createSimplePlan();
            expectSelectedEquals(current, simpleSut);
            expect(current.viewSwitch.isComplex).toBeFalsy();
        });

        it('Load simple plan to complex view', () => {
            const simpleSut = createSimplePlan();
            const urlParams = simpleSut.urlSerialization.toUrl();
            complexSut.urlSerialization.fromUrl(urlParams);
            complexSut.planner.calculate(2);
            expectSelectedEquals(simpleSut, complexSut);
            expect(complexSut.viewSwitch.isComplex).toBeTruthy();
        });

        it('Restore complex to complex', () => {
            const currentComplex = createSimpleSut();
            currentComplex.viewSwitch.isComplex = true;
            currentComplex.urlSerialization.fromUrl(complexViewUrl);
            currentComplex.planner.calculate(2);
            expectSelectedEquals(currentComplex, complexSut);
            expect(currentComplex.viewSwitch.isComplex).toBeTruthy();
        });
    });

    // TODO fix restore url from imperial units
    describe('Switching units', () => {
        xit('From metric units', () => {
            complexSut.tanksService.firstTank.size = 24;
            const url = complexSut.urlSerialization.toUrl();
            const current = createSimpleSut(true);
            current.tanksService.firstTank.workingPressure = 250;
            current.urlSerialization.fromUrl(url);

            const firstTank = current.tanksService.firstTank;
            // since working pressure is the main difference and affects size
            expect(firstTank.workingPressureBars).toBeCloseTo(0, 3);
            expect(firstTank.size).toBeCloseTo(24, 3);
        });

        xit('From imperial units', () => {
            const current = createSimpleSut(true);
            current.tanksService.firstTank.size = 240;
            const url = current.urlSerialization.toUrl();
            complexSut.urlSerialization.fromUrl(url);

            const firstTank = complexSut.tanksService.firstTank;
            expect(firstTank.workingPressure).toBeCloseTo(3442, 3);
            expect(firstTank.size).toBeCloseTo(240, 3);
        });

        xit('Switching units corrects out of metric range values', () => {
            const current = createSimpleSut(true);
            // still valid value in imperial, but not in metric
            current.tanksService.firstTank.size = 1;
            const url = current.urlSerialization.toUrl();
            complexSut.urlSerialization.fromUrl(url);

            const firstTank = complexSut.tanksService.firstTank;
            expect(firstTank.size).toBeCloseTo(1, 3);
        });
    });

    describe('Skips loading', () => {
        const assertImported = (urlParams: string): void => {
            const current = createComplexSut();
            current.urlSerialization.fromUrl(urlParams);
            expectSelectedEquals(current, complexSut);
        };

        it('Invalid url values', () => {
            // 2 tanks in simple mode, which isn't valid
            const urlParams = 't=1-15-0-210-0.209-0,2-11-0-200-0.5-0&de=0-30-102-1,30-30-618-1&' +
                'di=20&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&ao=0,0';
            assertImported(urlParams);
        });

        it('Invalid working pressure in metric', () => {
            const urlParams = 't=1-15-220-210-0.209-0,2-11.1-0-200-0.209-0&de=0-30-102-1,30-30-618-1,30-30-600-1&' +
                'di=20&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&ao=1,0';
            assertImported(urlParams);
        });

        it('Invalid working pressure in imperial', () => {
            const urlParams = 't=1-15-220-210-0.209-0,2-11.1-0-200-0.209-0&de=0-30-102-1,30-30-618-1,30-30-600-1&' +
                'di=20&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&ao=1,1';
            const current = createComplexSut();
            current.urlSerialization.fromUrl(urlParams);
            expectSelectedEquals(current, complexSut);
        });

        it('Empty string', () => {
            assertImported('');
        });

        it('Null string', () => {
            const planUrl: unknown = null;
            assertImported(<string>planUrl);
        });
    });
});
