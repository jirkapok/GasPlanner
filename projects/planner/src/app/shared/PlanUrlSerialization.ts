import { PlannerService } from './planner.service';
import { AppPreferences, PreferencesFactory } from './preferences.service';
import { WorkersFactoryCommon } from './serial.workers.factory';

export class PlanUrlSerialization {
    public static toUrl(plan: AppPreferences): string {
        const serialized: string = JSON.stringify(plan);
        // TODO encode to Base64 and than cut the invalid characters
        return serialized;
    }

    public static fromUrl(url: string): AppPreferences {
        if(!url) {
            // irrelevant factory
            const irrelevantFactory = new WorkersFactoryCommon();
            const planner = new PlannerService(irrelevantFactory);
            const prefs = PreferencesFactory.toPreferences(planner);
            return prefs;
        }

        const serialized = <AppPreferences>JSON.parse(url);
        return serialized;
    }
}
