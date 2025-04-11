/** Placeholder for features conditionally available. */
export class FeatureFlags
{
    private static _instance: FeatureFlags;

    public integratedHelp = false;
    public emergencyAscent = false;

    private constructor() {
    }

    public static get Instance()
    {
        return FeatureFlags._instance || (FeatureFlags._instance = new FeatureFlags());
    }
}
