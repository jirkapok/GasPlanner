import { DiveResults } from './diveresults';
import { OptionsService } from './options.service';
import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { Preferences } from './preferences';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewStates } from './viewStates';
import { ViewSwitchService } from './viewSwitchService';
import { WayPointsService } from './waypoints.service';
import {DepthsService} from './depths.service';

interface TestSut {
    options: OptionsService;
    depths: DepthsService;
    tanksService: TanksService;
    planner: PlannerService;
    viewSwitch: ViewSwitchService;
    units: UnitConversion;
    urlSerialization: PlanUrlSerialization;
}

describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();

    // because we need custom instances to compare
    const createSut = (imperial = false): TestSut => {
        const units = new UnitConversion();
        const options = new OptionsService(units);
        units.imperialUnits = imperial;
        const tanksService = new TanksService(units);
        const wayPoints = new WayPointsService(units);
        const dive = new DiveResults();
        const depths = new DepthsService(units, tanksService, dive, options);
        const planner = new PlannerService(irrelevantFactory, tanksService, depths, dive, options, wayPoints);
        depths.setSimple();
        const viewSwitch = new ViewSwitchService(depths, options, tanksService);
        const preferencesFactory = new Preferences(viewSwitch, units, tanksService, depths, options, new ViewStates());
        const urlSerialization = new PlanUrlSerialization(planner, viewSwitch,
            units, tanksService, depths, options, preferencesFactory);

        return {
            options: options,
            depths: depths,
            tanksService: tanksService,
            planner: planner,
            viewSwitch: viewSwitch,
            units: units,
            urlSerialization: urlSerialization
        };
    };

    const createCustomSut = () => {
        const created = createSut();
        created.viewSwitch.isComplex = true;
        created.tanksService.addTank();
        created.depths.addSegment();
        created.planner.calculate();
        return created;
    };

    /** in metric */
    let sut: TestSut;
    let customizedUrl: string;

    beforeEach(() => {
        sut = createCustomSut();
        customizedUrl = sut.urlSerialization.toUrl();
    });

    const expectParsedEquals = (current: TestSut): void => {
        const toExpect = {
            plan: sut.depths.segments,
            tansk: sut.tanksService.tankData,
            diver: sut.options.getDiver(),
            options: sut.options.getOptions(),
            isComplex: sut.viewSwitch.isComplex
        };

        const toCompare = {
            plan: current.depths.segments,
            tansk: current.tanksService.tankData,
            diver: current.options.getDiver(),
            options: current.options.getOptions(),
            isComplex: current.viewSwitch.isComplex
        };

        expect(toCompare).toEqual(toExpect);
    };

    it('Generates valid url characters', () => {
        const isValid = /[-a-zA-Z0-9@:%_+.~#&//=]*/g.test(customizedUrl);
        expect(isValid).toBeTruthy();
    });

    it('Serialize application options', () => {
        sut.viewSwitch.isComplex = true;
        sut.units.imperialUnits = true;
        const url = sut.urlSerialization.toUrl();
        expect(url).toContain('ao=1,1');
    });

    it('Serialize and deserialize complex plan', () => {
        const current = createSut();
        current.urlSerialization.fromUrl(customizedUrl);
        expectParsedEquals(current);
    });

    it('Serialize and deserialize simple plan', () => {
        const simpleSut = createSut();
        simpleSut.tanksService.tanks[0].size = 18;
        simpleSut.planner.calculate();
        const urlParams = simpleSut.urlSerialization.toUrl();
        sut.urlSerialization.fromUrl(urlParams);
        expectParsedEquals(simpleSut);
    });

    it('Decodes url for facebook link', () => {
        const encodedParams = encodeURIComponent(customizedUrl);
        const current = createSut();
        current.urlSerialization.fromUrl(encodedParams);
        expectParsedEquals(current);
    });

    it('Complex plan in imperial units still generates url below 2048 characters', () => {
        const current = createSut(true);
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

    describe('Restore switching units', () => {
        it('From metric units', () => {
            sut.tanksService.firstTank.size = 24;
            const url = sut.urlSerialization.toUrl();
            const current = createSut(true);
            current.tanksService.firstTank.workingPressure = 250;
            current.urlSerialization.fromUrl(url);

            const firstTank = current.tanksService.firstTank;
            // since working pressure is the main difference and affects size
            expect(firstTank.workingPressureBars).toBeCloseTo(0, 3);
            expect(firstTank.size).toBeCloseTo(24, 3);
        });

        it('From imperial units', () => {
            const current = createSut(true);
            current.tanksService.firstTank.size = 240;
            const url = current.urlSerialization.toUrl();
            sut.urlSerialization.fromUrl(url);

            const firstTank = sut.tanksService.firstTank;
            expect(firstTank.workingPressure).toBeCloseTo(3442, 3);
            expect(firstTank.size).toBeCloseTo(240, 3);
        });

        it('Switching units corrects out of metric range values', () => {
            const current = createSut(true);
            // still valid value in imperial, but not in metric
            current.tanksService.firstTank.size = 1;
            const url = current.urlSerialization.toUrl();
            sut.urlSerialization.fromUrl(url);

            const firstTank = sut.tanksService.firstTank;
            expect(firstTank.size).toBeCloseTo(1, 3);
        });
    });

    describe('Skips loading', () => {
        const assertImported = (urlParams: string): void => {
            const current = createCustomSut();
            current.urlSerialization.fromUrl(urlParams);
            expectParsedEquals(current);
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
            const current = createCustomSut();
            current.urlSerialization.fromUrl(urlParams);
            expectParsedEquals(current);
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
