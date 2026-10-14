/** Breathing apparatus used during the dive. Values start from 1, because 0 is considered as not defined. */
export enum CircuitType {
    /** Open circuit */
    oc = 1,
    /** Passive semi-closed rebreather */
    pscr = 2,
    /** Manual closed circuit rebreather */
    mccr = 3,
    /** Electronic closed circuit rebreather */
    eccr = 4
}

export class RebreatherDefaults {
    /** Liters/minute surface equivalent */
    public static readonly metabolicO2 = 1.0;
    /** Liters */
    public static readonly loopVolume = 6;
    /** pSCR ratio of breathed to dumped volume */
    public static readonly injectionRatio = 8;
    /** mCCR oxygen partial pressure in bars held by the diver */
    public static readonly setpoint = 1.3;
    /** mCCR needle valve oxygen flow in liters/minute surface equivalent */
    public static readonly o2Flow = 0.8;
}

/** Rebreather configuration, rebreather type specific values are added by each rebreather type. */
export class RebreatherOptions {
    /** pSCR only: ratio of breathed to dumped volume, range 4-20 */
    public injectionRatio = RebreatherDefaults.injectionRatio;
    /** mCCR only: oxygen partial pressure in bars manually held by the diver, range 0.4-1.6 */
    public setpoint = RebreatherDefaults.setpoint;
    /** mCCR only: constant mass flow of oxygen in liters/minute, range 0.3-3 */
    public o2Flow = RebreatherDefaults.o2Flow;

    constructor(
        public circuit: CircuitType = CircuitType.oc,
        /** Oxygen consumed by the diver in liters/minute surface equivalent, range 0.5-3 */
        public metabolicO2: number = RebreatherDefaults.metabolicO2,
        /** Breathing loop volume in liters */
        public loopVolume: number = RebreatherDefaults.loopVolume
    ) { }

    public loadFrom(source: RebreatherOptions): void {
        this.circuit = source.circuit || this.circuit;
        this.metabolicO2 = source.metabolicO2 || this.metabolicO2;
        this.loopVolume = source.loopVolume || this.loopVolume;
        this.injectionRatio = source.injectionRatio || this.injectionRatio;
        this.setpoint = source.setpoint || this.setpoint;
        this.o2Flow = source.o2Flow || this.o2Flow;
    }
}
