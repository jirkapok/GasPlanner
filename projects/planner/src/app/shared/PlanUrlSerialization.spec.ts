import { PlannerService } from './planner.service';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { AppPreferences, PreferencesFactory } from './preferences.service';
import { WorkersFactoryCommon } from './serial.workers.factory';

describe('Url Serialization', () => {
    let defaultPlan: AppPreferences;
    let comparePlan: AppPreferences;

    beforeEach(() => {
        const irrelevantFactory = new WorkersFactoryCommon();
        const planner = new PlannerService(irrelevantFactory);
        defaultPlan = PreferencesFactory.toPreferences(planner);
        planner.addSegment();
        planner.addTank();
        comparePlan = PreferencesFactory.toPreferences(planner);
    });

    it('Serialize and deserialize plan', () => {
        const dto = PlanUrlSerialization.toUrl(comparePlan);
        const resolved = PlanUrlSerialization.fromUrl(dto);
        expect(resolved).toEqual(comparePlan);
    });

    it('Deserialize empty string', () => {
        const deserialized = PlanUrlSerialization.fromUrl('');
        expect(deserialized).toEqual(defaultPlan);
    });

    it('Deserialize null', () => {
        const planUrl: any = null;
        const deserialized = PlanUrlSerialization.fromUrl(<string>planUrl);
        expect(deserialized).toEqual(defaultPlan);
    });
});
