import { OptionsDispatcherService } from './options-dispatcher.service';
import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';

describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();
    let options: OptionsDispatcherService;
    let defaultPlan: PlannerService;
    let planner: PlannerService;
    let tanksService: TanksService;
    let customizedUrl: string;
    const createPlanner = () => new PlannerService(irrelevantFactory, tanksService);

    beforeEach(() => {
        tanksService = new TanksService(new UnitConversion());
        tanksService.addTank();

        options = new OptionsDispatcherService();
        defaultPlan = createPlanner();
        planner =  createPlanner();
        planner.isComplex = true;
        planner.addSegment();
        planner.calculate();
        customizedUrl = PlanUrlSerialization.toUrl(planner, tanksService, options);
    });

    const expectParsedEquals = (expected: PlannerService, current: PlannerService): void => {
        const toExpect = {
            plan: expected.plan.segments,
            tansk: tanksService.tankData,
            diver: expected.diver,
            options: expected.options,
            isComplex: expected.isComplex
        };

        const toCompare = {
            plan: current.plan.segments,
            tansk: tanksService.tankData,
            diver: current.diver,
            options: current.options,
            isComplex: current.isComplex
        };

        expect(toCompare).toEqual(toExpect);
    };

    it('Generates valid url characters', () => {
        const urlParams = PlanUrlSerialization.toUrl(planner, tanksService, options);
        const isValid = /[-a-zA-Z0-9@:%_+.~#&//=]*/g.test(urlParams);
        expect(isValid).toBeTruthy();
    });

    it('Serialize and deserialize complex plan', () => {
        const urlParams = PlanUrlSerialization.toUrl(planner, tanksService, options);
        const current = createPlanner();
        PlanUrlSerialization.fromUrl(urlParams, options, tanksService, current);
        expectParsedEquals(planner, current);
    });

    it('Serialize and deserialize simple plan', () => {
        const source = createPlanner();
        tanksService.tanks[0].size = 18;
        source.calculate();
        const urlParams = PlanUrlSerialization.toUrl(source, tanksService, options);
        const current = createPlanner();
        PlanUrlSerialization.fromUrl(urlParams, options, tanksService, current);
        expectParsedEquals(source, current);
    });

    it('Decodes url for facebook link', () => {
        const encodedParams = encodeURIComponent(customizedUrl);
        const current = createPlanner();
        PlanUrlSerialization.fromUrl(encodedParams, options, tanksService, current);
        expectParsedEquals(current, planner);
    });

    describe('Skips loading', () => {
        it('Invalid url values', () => {
            // 2 tanks in simple mode, which isn't valid
            const urlParams = 't=1-15-200-0.209-0,2-11-200-0.5-0&de=0-30-102-1,30-30-618-1&' +
                'di=20,1.4,1.6&o=0,9,6,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1&c=0';
            const current = createPlanner();
            PlanUrlSerialization.fromUrl(urlParams, options, tanksService, current);
            expectParsedEquals(current, defaultPlan);
        });

        it('Empty string', () => {
            const current = createPlanner();
            PlanUrlSerialization.fromUrl('', options, tanksService, current);
            expectParsedEquals(current, defaultPlan);
        });

        it('Null string', () => {
            const planUrl: any = null;
            const current = createPlanner();
            PlanUrlSerialization.fromUrl(<string>planUrl, options, tanksService, current);
            expectParsedEquals(current, defaultPlan);
        });
    });
});
