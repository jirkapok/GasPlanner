import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { WorkersFactoryCommon } from './serial.workers.factory';

describe('Url Serialization', () => {
    const irrelevantFactory = new WorkersFactoryCommon();
    let defaultPlan: PlannerService;
    let planner: PlannerService;

    beforeEach(() => {
        defaultPlan = new PlannerService(irrelevantFactory);
        planner = new PlannerService(irrelevantFactory);
        planner.addSegment();
        planner.addTank();
    });

    const expectParsedEquals = (expected: PlannerService, current: PlannerService): void => {
        const toExpect = {
            plan: expected.plan.segments,
            tansk: expected.tanks,
            diver: expected.diver,
            options: expected.options,
            isComplex: expected.isComplex
        };

        const toCompare = {
            plan: current.plan.segments,
            tansk: current.tanks,
            diver: current.diver,
            options: current.options,
            isComplex: current.isComplex
        };

        expect(toCompare).toEqual(toExpect);
    };

    it('Generates valid url characters', () => {
        const urlParams = PlanUrlSerialization.toUrl(planner);
        const isValid = /[-a-zA-Z0-9@:%_+.~#&//=]*/g.test(urlParams);
        expect(isValid).toBeTruthy();
    });

    it('Serialize and deserialize plan', () => {
        const urlParams = PlanUrlSerialization.toUrl(planner);
        const current = new PlannerService(irrelevantFactory);
        PlanUrlSerialization.fromUrl(urlParams, current);
        expectParsedEquals(planner, current);
    });

    it('Deserialize empty string', () => {
        const current = new PlannerService(irrelevantFactory);
        PlanUrlSerialization.fromUrl('', current);
        expectParsedEquals(current, defaultPlan);
    });

    it('Deserialize null', () => {
        const planUrl: any = null;
        const current = new PlannerService(irrelevantFactory);
        PlanUrlSerialization.fromUrl(<string>planUrl, current);
        expectParsedEquals(current, defaultPlan);
    });
});
