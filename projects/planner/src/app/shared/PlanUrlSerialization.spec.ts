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
import { SettingsNormalizationService } from './settings-normalization.service';
import { AirBreakOptions, Diver } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { QuizService } from './learn/quiz.service';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

class TestSut {
    constructor(
        public schedules: DiveSchedules,
        public planner: PlannerService,
        public viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        public urlSerialization: PlanUrlSerialization,
        public appSettings: ApplicationSettingsService) {
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

describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();
    const mockModalService = jasmine.createSpyObj<MdbModalService>('MdbModalService', ['open']);


    // because we need custom instances to compare
    const createSimpleSut = (imperial = false): TestSut => {
        const units = new UnitConversion();
        const dispatcher = new ReloadDispatcher();
        units.imperialUnits = imperial;
        const schedules = new DiveSchedules(units, dispatcher);
        const viewSwitch = new ViewSwitchService(schedules);
        const appSettings = new ApplicationSettingsService(units);
        const planner = new PlannerService(schedules, dispatcher, viewSwitch, appSettings, irrelevantFactory, units);
        const preferences = new Preferences(viewSwitch, units, schedules, appSettings, new ViewStates(), new QuizService(mockModalService));
        const normalization = new SettingsNormalizationService(units, appSettings, schedules);
        const urlSerialization = new PlanUrlSerialization(viewSwitch, units, normalization,
            schedules, appSettings, preferences);
        const firstDive = schedules.dives[0];
        firstDive.depths.setSimple();
        return new TestSut(schedules, planner, viewSwitch, units,  urlSerialization, appSettings);
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

    it('AppSettings arn`t part of url', () => {
        complexSut.appSettings.maxGasDensity = 6;
        complexSut.appSettings.primaryTankReserve = 21;
        complexSut.appSettings.stageTankReserve = 22;
        complexSut.urlSerialization.fromUrl(complexViewUrl);

        expect(complexSut.appSettings.maxGasDensity).toBeCloseTo(6, 1);
        expect(complexSut.appSettings.primaryTankReserve).toBeCloseTo(21, 1);
        expect(complexSut.appSettings.stageTankReserve).toBeCloseTo(22, 1);
    });

    describe('Diver options', () => {
        it('Serialize both Rmv and stressRmv', () => {
            expect(simpleViewUrl).toContain('di=20,30');
        });

        it('Deserialize both missing Rmv and stressRmv', () => {
            const missingStressUrl = 't=1-18-0-200-0.209-0&' +
                'de=0-30-102-1,30-30-618-1&' +
                'di=24&' +
                'o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&' +
                'ao=0,0';
            complexSut.urlSerialization.fromUrl(missingStressUrl);
            expect(complexSut.schedules.selected.optionsService.getDiver()).toEqual(new Diver(24, 36));
        });
    });

    describe('Air break options', () => {
        it('Serialize air break options', () => {
            expect(simpleViewUrl).toContain('o=0,9,3,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,0,20,5&');
        });

        it('Deserialize missing Air break options', () => {
            const missingStressUrl = 't=1-18-0-200-0.209-0&' +
                'de=0-30-102-1,30-30-618-1&' +
                'di=24&' +
                'o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&' +
                'ao=0,0';
            complexSut.urlSerialization.fromUrl(missingStressUrl);
            expect(complexSut.schedules.selected.optionsService.airBreaks)
                .toEqual(new AirBreakOptions(true, 20, 5));
        });
        it('Deserialize Air break options', () => {
            const missingStressUrl = 't=1-18-0-200-0.209-0&' +
                'de=0-30-102-1,30-30-618-1&' +
                'di=24&' +
                'o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,1,17,3&' +
                'ao=0,0';
            complexSut.urlSerialization.fromUrl(missingStressUrl);
            expect(complexSut.schedules.selected.optionsService.airBreaks)
                .toEqual(new AirBreakOptions(true, 17, 3));
        });
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

        // Solutions considered:
        // * Prolong duration shorter than one minute - with small differences, but it is acceptable.
        //   Also keeps aligned the UI for both views minimum 1 minute.
        // * Allow shorter duration than 1 min -> issue with infinite descent/ascent speed - too much work.
        // * Don't allow it - edge case not supported is to aggressive. We should support it.
        it('Restore short descent duration from simple to complex', () => {
            const currentComplex = createSimpleSut();
            currentComplex.viewSwitch.isComplex = true;

            // 15 m/60 minutes - dive created in simple view, descent takes only 54 seconds, which is invalid in complex view
            const fastDescentUrl = '?t=1-15-0-200-0.209-0,2-11.1-0-200-1-0&' +
                                          'de=0-15-54-1,15-15-3546-1&' +
                                          'di=20&o=0,9,9,9,3,18,2,0.85,0.4,5,1.6,30,1.4,10,1,1,0,2,1&ao=1,0';
            currentComplex.urlSerialization.fromUrl(fastDescentUrl);

            // not fixing the value, allowing to restore invalid values
            expect(currentComplex.depths.levels[0].duration).toBeCloseTo(0.9, 0);
        });
    });

    describe('Load dive by Url', () => {
        it('Does not add new dive on Refresh', () => {
            const currentSimple = createSimplePlan();
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            expect(currentSimple.schedules.length).toEqual(1);
        });

        it('Adds new dive', () => {
            const currentSimple = createSimpleSut();
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            expect(currentSimple.schedules.length).toEqual(2);
        });

        it('Ignores complex view flag when searching for current dive', () => {
            const currentSimple = createSimplePlan();
            currentSimple.viewSwitch.isComplex = true;
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            currentSimple.urlSerialization.fromUrl(simpleViewUrl);
            expect(currentSimple.schedules.length).toEqual(1);
        });
    });

    describe('Surface interval', () => {
        it('Creates 1. dive url without surface interval ', () => {
            const sut = createSimplePlan();
            const diveUrl = sut.urlSerialization.toUrlFor(1);
            expect(diveUrl.indexOf('&si=')).toEqual(-1);
        });

        it('Creates 2. dive url with surface interval ', () => {
            const sut = createSimplePlan();
            const dive = sut.schedules.add();
            dive.apply30MinutesSurfaceInterval(); // default dive has no surface interval
            const diveUrl = sut.urlSerialization.toUrlFor(dive.id);
            expect(diveUrl.indexOf('&si=')).not.toEqual(-1);
        });

        it('Restores dive surface interval', () => {
            const source = createSimpleSut();
            const dive = source.schedules.add();
            dive.apply30MinutesSurfaceInterval();
            const urlWithSurfaceInterval = source.urlSerialization.toUrlFor(dive.id);
            const current = createSimpleSut();
            current.urlSerialization.fromUrl(urlWithSurfaceInterval);
            expect(current.schedules.length).toEqual(2);
            expect(current.schedules.dives[1].surfaceInterval).toEqual(1800);
        });
    });

    describe('Switching units', () => {
        it('From metric units', () => {
            complexSut.tanksService.firstTank.size = 24;
            const url = complexSut.urlSerialization.toUrl();
            const current = createSimpleSut(true);
            current.tanksService.firstTank.workingPressure = 250;
            current.urlSerialization.fromUrl(url);

            const firstTank = current.tanksService.firstTank;
            // since working pressure is the main difference and affects size
            expect(firstTank.workingPressure).toBeCloseTo(3442, 3);
            expect(firstTank.tank.size).toBeCloseTo(23.995, 3);
        });

        it('From imperial units', () => {
            const source = createSimpleSut(true);
            source.tanksService.firstTank.size = 240;
            const url = source.urlSerialization.toUrl();
            complexSut.urlSerialization.fromUrl(url);

            const firstTank = complexSut.tanksService.firstTank;
            expect(firstTank.workingPressure).toBeCloseTo(0);
            expect(firstTank.size).toBeCloseTo(28.6, 3);
        });

        it('Switching units corrects out of metric range values', () => {
            const source = createSimpleSut(true);
            // still valid value in imperial, but not in metric
            source.tanksService.firstTank.size = 1;
            const url = source.urlSerialization.toUrl();
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
