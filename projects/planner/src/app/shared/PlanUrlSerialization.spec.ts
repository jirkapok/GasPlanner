import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';

interface TestSut {
    options: OptionsService;
    plan: Plan;
    tanksService: TanksService;
    planner: PlannerService;
    viewSwitch: ViewSwitchService;
    urlSerialization: PlanUrlSerialization;
}

describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();

    const createSut = (imperial = false): TestSut => {
        const options = new OptionsService();
        const plan = new Plan();
        const units = new UnitConversion();
        units.imperialUnits = imperial;
        const tanksService = new TanksService(units);
        const planner = new PlannerService(irrelevantFactory, tanksService, plan, options);
        plan.setSimple(30, 12, tanksService.firstTank.tank, planner.options);
        const viewSwitch = new ViewSwitchService(plan, options, tanksService);
        const urlSerialization = new PlanUrlSerialization(planner, tanksService, viewSwitch, options, plan);

        return {
            options: options,
            plan: plan,
            tanksService: tanksService,
            planner: planner,
            viewSwitch: viewSwitch,
            urlSerialization: urlSerialization
        };
    };

    const createCustomSut = () => {
        const created = createSut();
        created.viewSwitch.isComplex = true;
        created.tanksService.addTank();
        created.plan.addSegment(created.tanksService.firstTank.tank);
        created.planner.calculate();
        return created;
    };

    let sut: TestSut;
    let customizedUrl: string;

    beforeEach(() => {
        sut = createCustomSut();
        customizedUrl = sut.urlSerialization.toUrl();
    });

    const expectParsedEquals = (current: TestSut): void => {
        const toExpect = {
            plan: sut.plan.segments,
            tansk: sut.tanksService.tankData,
            diver: sut.planner.diver,
            options: sut.options.getOptions(),
            isComplex: sut.viewSwitch.isComplex
        };

        const toCompare = {
            plan: current.plan.segments,
            tansk: current.tanksService.tankData,
            diver: current.planner.diver,
            options: current.options.getOptions(),
            isComplex: current.viewSwitch.isComplex
        };

        expect(toCompare).toEqual(toExpect);
    };

    it('Generates valid url characters', () => {
        const isValid = /[-a-zA-Z0-9@:%_+.~#&//=]*/g.test(customizedUrl);
        expect(isValid).toBeTruthy();
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
            current.plan.addSegment(current.tanksService.firstTank.tank);
        }

        const result = current.urlSerialization.toUrl();
        expect(result.length).toBeLessThan(2048);
    });

    it('Complex plan is restored to app in imperial units', () => {
        const expectedBars = 250;
        sut.tanksService.firstTank.workingPressure = expectedBars;
        const url = sut.urlSerialization.toUrl();
        const current = createSut(true);
        current.urlSerialization.fromUrl(url);
        // since working pressure is the main difference in handling of units
        const firstTank = current.tanksService.firstTank;
        expect(firstTank.workingPressureBars).toBeCloseTo(expectedBars, 3);
    });

    describe('Skips loading', () => {
        it('Invalid url values', () => {
            // 2 tanks in simple mode, which isn't valid
            const urlParams = 't=1-15-200-0.209-0,2-11-200-0.5-0&de=0-30-102-1,30-30-618-1&' +
                'di=20,1.4,1.6&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&c=0';
            const current = createCustomSut();
            current.urlSerialization.fromUrl(urlParams);
            expectParsedEquals(current);
        });

        it('Empty string', () => {
            const current = createCustomSut();
            current.urlSerialization.fromUrl('');
            expectParsedEquals(current);
        });

        it('Null string', () => {
            const planUrl: unknown = null;
            const current = createCustomSut();
            current.urlSerialization.fromUrl(<string>planUrl);
            expectParsedEquals(current);
        });
    });
});
