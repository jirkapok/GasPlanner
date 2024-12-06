export class FeatureFlags
{
    private static _instance: FeatureFlags;

    public collectSaturation = false;

    private constructor() {
    }

    public static get Instance()
    {
        return FeatureFlags._instance || (FeatureFlags._instance = new FeatureFlags());
    }
}
