export class FeatureFlags
{
    private static _instance: FeatureFlags;

    // TODO remove, no longer used
    public collectSaturation = true;

    private constructor() {
    }

    public static get Instance()
    {
        return FeatureFlags._instance || (FeatureFlags._instance = new FeatureFlags());
    }
}
