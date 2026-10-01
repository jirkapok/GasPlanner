/** Breathing apparatus used during the dive. Values start from 1, because 0 is considered as not defined. */
export enum CircuitType {
    /** Open circuit */
    OC = 1,
    /** Passive semi-closed rebreather */
    PSCR = 2,
    /** Manual closed circuit rebreather */
    MCCR = 3,
    /** Electronic closed circuit rebreather */
    ECCR = 4
}

export class RebreatherDefaults {
    /** Liters/minute surface equivalent */
    public static readonly metabolicO2 = 1.0;
    /** Liters */
    public static readonly loopVolume = 6;
}

/** Rebreather configuration, rebreather type specific values are added by each rebreather type. */
export class RebreatherOptions {
    constructor(
        public circuit: CircuitType = CircuitType.OC,
        /** Oxygen consumed by the diver in liters/minute surface equivalent, range 0.5-3 */
        public metabolicO2: number = RebreatherDefaults.metabolicO2,
        /** Breathing loop volume in liters */
        public loopVolume: number = RebreatherDefaults.loopVolume
    ) { }

    public loadFrom(source: RebreatherOptions): void {
        this.circuit = source.circuit || this.circuit;
        this.metabolicO2 = source.metabolicO2 || this.metabolicO2;
        this.loopVolume = source.loopVolume || this.loopVolume;
    }
}
