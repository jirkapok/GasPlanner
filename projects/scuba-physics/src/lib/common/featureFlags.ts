/** Placeholder for features conditionally available. */
export class FeatureFlags {
    private static _instance: FeatureFlags;

    private constructor() {
    }

    public static get instance() {
        return FeatureFlags._instance || (FeatureFlags._instance = new FeatureFlags());
    }
}
