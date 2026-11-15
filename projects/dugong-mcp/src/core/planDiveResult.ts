import { EventType } from 'scuba-physics';

/** The disclaimer shown by the application (English "disclaimerText" in the planner i18n files) */
export const disclaimer = 'None of the authors, contributors, administrators, or anyone else connected with this project ' +
    'can be responsible for your use of the information provided by this application or linked from these web pages. ' +
    'Use the results at your own risk.';

export interface DecoStop {
    /** m */
    depth: number;
    /** min */
    duration: number;
    gas: string;
}

export interface TankResult {
    /** 1 based order of the tank in the input */
    index: number;
    gas: string;
    /** l */
    size: number;
    /** bar */
    startPressure: number;
    /** bar */
    endPressure: number;
    /** bar */
    reservePressure: number;
    /** l */
    consumedVolume: number;
    hasReserve: boolean;
}

export interface DiveEvent {
    /** Name of the event type, e.g. lowPpO2 */
    type: string;
    /** min from the start of the dive */
    runtime: number;
    /** m */
    depth: number;
    message: string;
}

export interface PlanDiveResult {
    /** bottom time is not longer than the no decompression limit */
    noDecoDive: boolean;
    /** min */
    noDecoLimit: number;
    /** min, the whole calculated profile */
    runtime: number;
    /** min, emergency ascent */
    timeToSurface: number;
    /** m */
    maxDepth: number;
    /** m */
    averageDepth: number;
    /** flat ascent segments incl. gas switches and the safety stop */
    decoStops: DecoStop[];
    tanks: TankResult[];
    /** % */
    cns: number;
    /** OTU */
    otu: number;
    /** g/l and m */
    maxDensity: { density: number; depth: number; gas: string };
    events: DiveEvent[];
    /** algorithm errors, the plan is not calculated when not empty */
    errors: string[];
    disclaimer: string;
}

/** English texts of the application dive issues (en.json "diveIssues") of the events reported to the user */
const eventTexts: Partial<Record<EventType, string>> = {
    [EventType.error]: 'There was an error while calculating profile.',
    [EventType.noDecoEnd]: 'No decompression time for current depth exceeded!',
    [EventType.lowPpO2]: 'Reached low partial pressure of oxygen (minimum depth exceeded)! There is a risk of hypoxia. ' +
        'Use gas with higher oxygen content.',
    [EventType.highPpO2]: 'Reached high partial pressure of oxygen (maximum depth exceeded)! There is a risk of oxygen toxicity. ' +
        'Reduce the depth or use gas with lower oxygen content.',
    [EventType.highAscentSpeed]: 'High ascent speed! Ascent to higher depth only or ascent longer time.',
    [EventType.highDescentSpeed]: 'High descent speed! Descent longer time or descent to lower depth.',
    [EventType.brokenCeiling]: 'Exceeded minimum safe (ceiling) depth! Change your plan to higher depth at this point.',
    [EventType.maxEndExceeded]: 'Exceeded maximum narcotic depth for selected gas! Reduce the depth or use gas with higher helium content.',
    [EventType.isobaricCounterDiffusion]: 'Gas switch to gas with higher nitrogen content is not recommended! ' +
        'There is a risk of Isobaric Counter Diffusion (ICD). Switch to another gas with higher helium content or lower nitrogen content.',
    [EventType.highGasDensity]: 'Exceeded maximum recommended gas density! ' +
        'Reduce the depth or use gas with higher helium content (i.e. lower density).',
    [EventType.minDepth]: 'Dives planned to shallow depth for long time may lead to saturation diving! ' +
        'Reduce the dive duration shorter than 5 hours.',
    [EventType.maxDepth]: 'Exceeded maximum depth where the algorithm was well tested on real life data! Reduce the maximum depth.',
    [EventType.missingAirBreak]: 'It is recommended to don\'t breath pure oxygen longer than 20 minutes. ' +
        'Use air break option to generate proper gas switches or manually add switch to bottom gas.'
};

/** Gets the English message of the event reported to the user, undefined for events which aren't issues (e.g. gas switch) */
export const eventText = (type: EventType): string | undefined => eventTexts[type];

/** Short English text of the plan for the user, the disclaimer is always the last paragraph */
export const summaryText = (result: PlanDiveResult): string => {
    const lines: string[] = [];

    if (result.errors.length > 0) {
        lines.push('The dive can\'t be planned:');
        result.errors.forEach(e => lines.push(`- ${e}`));
    } else {
        const decoKind = result.noDecoDive ? 'No decompression dive' : 'Decompression dive';
        lines.push(`${decoKind}, no decompression limit ${result.noDecoLimit} min.`);
        lines.push(`Runtime ${result.runtime} min, time to surface ${result.timeToSurface} min.`);
        lines.push(`Max depth ${result.maxDepth} m, average depth ${result.averageDepth} m.`);

        if (result.decoStops.length > 0) {
            lines.push('Stops:');
            result.decoStops.forEach(s => lines.push(`- ${s.depth} m ${s.duration} min ${s.gas}`));
        }

        lines.push('Tanks:');
        result.tanks.forEach(t => {
            const reserve = t.hasReserve ? 'reserve kept' : 'NOT ENOUGH GAS, reserve not kept';
            lines.push(`- ${t.index}. ${t.size} l ${t.gas}: ${t.startPressure} -> ${t.endPressure} bar ` +
                `(reserve ${t.reservePressure} bar, ${reserve})`);
        });

        lines.push(`CNS ${result.cns} %, OTU ${result.otu}.`);
        lines.push(`Max gas density ${result.maxDensity.density} g/l at ${result.maxDensity.depth} m (${result.maxDensity.gas}).`);

        if (result.events.length > 0) {
            lines.push('Warnings:');
            result.events.forEach(e => lines.push(`- ${e.runtime} min, ${e.depth} m: ${e.message}`));
        }
    }

    lines.push('', result.disclaimer);
    return lines.join('\n') + '\n';
};
