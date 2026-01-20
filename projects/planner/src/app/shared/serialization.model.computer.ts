import { EventType } from 'scuba-physics';
import { DiveResults } from './diveresults';

export interface RunTimePoint {
    /** in seconds**/
    runTime: number;
    /** in meters **/
    depth: number;
    /** in meters **/
    ceiling: number;
    /** in seconds **/
    ndl: number;
    /**
     * Not the total runtime to end of the dive, but current time to surface at this point in the dive profile.
     * This will require calculate the profile for every second of the dive - performance hit maybe not feasible.
     * in seconds.
    **/
    tts: number;
}

export interface Warning {
    /** in seconds**/
    runTime: number;
    eventType: EventType;
    message: string;
}

/**
 * Model to generate data for computer visualization.
 * Sampling for every second of the dive.
 */
export interface ComputerData {
    profile: RunTimePoint[];
    events: Warning[];
}


export class ComputerProfile {
    public static calculate(dive: DiveResults): ComputerData {
        const profile: RunTimePoint[] = dive.ceilings.map(c => {
            return {
                runTime: c.time,
                depth: c.depth,
                ceiling: c.depth,
                ndl: 0, // TODO NDL and TTS
                tts: 0
            };
        });

        return {
            profile: profile,
            events: []
        };
    }
}
