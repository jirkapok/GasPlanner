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
    /** eCCR oxygen partial pressure in bars during descent, shallower than the switch depth */
    public static readonly descentSetpoint = 0.7;
    /** eCCR oxygen partial pressure in bars at the bottom, deeper than the switch depth */
    public static readonly bottomSetpoint = 1.1;
    /** eCCR oxygen partial pressure in bars from the deepest point of the dive */
    public static readonly decoSetpoint = 1.3;
    /** eCCR depth in meters, where the descent setpoint is switched to the bottom setpoint */
    public static readonly setpointSwitchDepth = 20;
    /** eCCR fraction of the metabolic oxygen lost (mask clearing, leaks) */
    public static readonly o2Loss = 0.1;
}

/** Rebreather configuration, rebreather type specific values are added by each rebreather type. */
export class RebreatherOptions {
    /** pSCR only: ratio of breathed to dumped volume, range 4-20 */
    public injectionRatio = RebreatherDefaults.injectionRatio;
    /** mCCR only: oxygen partial pressure in bars manually held by the diver, range 0.4-1.6 */
    public setpoint = RebreatherDefaults.setpoint;
    /** mCCR only: constant mass flow of oxygen in liters/minute, range 0.3-3 */
    public o2Flow = RebreatherDefaults.o2Flow;
    /** eCCR only: setpoint in bars shallower than the switch depth before the deepest point, range 0.4-1.6 */
    public descentSetpoint = RebreatherDefaults.descentSetpoint;
    /** eCCR only: setpoint in bars deeper than the switch depth before the deepest point, range 0.4-1.6 */
    public bottomSetpoint = RebreatherDefaults.bottomSetpoint;
    /** eCCR only: setpoint in bars from the deepest point of the dive, range 0.4-1.6 */
    public decoSetpoint = RebreatherDefaults.decoSetpoint;
    /** eCCR only: depth in meters to switch from descent to bottom setpoint, range 3-30 m */
    public setpointSwitchDepth = RebreatherDefaults.setpointSwitchDepth;
    /** eCCR only: fraction 0-1 of the metabolic oxygen lost */
    public o2Loss = RebreatherDefaults.o2Loss;

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
        this.descentSetpoint = source.descentSetpoint || this.descentSetpoint;
        this.bottomSetpoint = source.bottomSetpoint || this.bottomSetpoint;
        this.decoSetpoint = source.decoSetpoint || this.decoSetpoint;
        this.setpointSwitchDepth = source.setpointSwitchDepth || this.setpointSwitchDepth;
        this.o2Loss = source.o2Loss || this.o2Loss;
    }
}
