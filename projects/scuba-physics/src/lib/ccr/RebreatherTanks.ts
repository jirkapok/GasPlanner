import { Tank } from '../consumption/Tanks';

/** Rebreather roles of tanks assigned by their position in the dive tanks list */
export class RebreatherTanks {
    /** Closed circuit rebreathers use the second tank as oxygen source */
    public static readonly oxygenIndex = 1;

    /** Returns the closed circuit rebreather oxygen tank or undefined, if there isn't any */
    public static oxygen(tanks: Tank[]): Tank | undefined {
        return tanks[RebreatherTanks.oxygenIndex];
    }
}
