interface Interval {
    /** seconds */
    left: number;

    /** seconds */
    right: number;
}

export interface SearchContext {
    /** Initial step used to find highest (upper boundary) limit */
    estimationStep: number;
    /** Lower boundary for the search */
    initialValue: number;
    /** Upper boundary extreme limit when searching its limit */
    maxValue: number;
    /** method to be executed before calling meetsCondition */
    doWork: (newValue: number) => void;
    /** Method used to decide, if the value is still in range */
    meetsCondition: () => boolean;
}

/**
 * High performance way to find next appropriate lowest higher value in sorted array.
  * Used to predict no decompression limit or deco stop duration based on ceiling.
 * Uses binary (half interval) search algorithm.
 * https://en.wikipedia.org/wiki/Binary_search_algorithm
 */
export class BinaryIntervalSearch {
    /* in our usage minimal step corresponds to one second. */
    private static readonly minimalStep = 1;
    constructor() { }

    public search(context: SearchContext): number {
        if(context.maxValue < context.initialValue){
            throw Error('Max value cant be smaller than initial value');
        }

        if(context.estimationStep > context.maxValue - context.initialValue){
            throw Error('Step cant be larger than range');
        }

        const limits = this.findInitialLimit(context);
        const result = this.searchInsideInterval(context, limits);
        return result;
    }

    private searchInsideInterval(context: SearchContext, limits: Interval): number {
        while (limits.right - limits.left > BinaryIntervalSearch.minimalStep) {
            let middle = limits.left + (limits.right - limits.left) / 2;
            middle = Math.round(middle);
            context.doWork(middle);

            if (context.meetsCondition()) {
                limits.left = middle;
            } else {
                limits.right = middle;
            }
        }

        return limits.left;
    }

    /** Guess right upper value by adding step to current value and prevent left 0 or positive value */
    private findInitialLimit(context: SearchContext): Interval {
        let current = context.initialValue;
        context.doWork(current);

        while (context.meetsCondition() && current <= context.maxValue) {
            current += context.estimationStep;
            context.doWork(current);
        }

        let leftLimit = current - context.estimationStep;
        leftLimit = leftLimit < context.initialValue ? context.initialValue : leftLimit;
        const rightLimit = current > context.maxValue ? context.maxValue : current;

        return {
            left: leftLimit,
            right: rightLimit
        };
    }
}
