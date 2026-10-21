import { ClosedCircuitBreathing } from './ClosedCircuitBreathing';
import { Rebreathers } from './Rebreathers';

/**
 * Manual closed circuit rebreather. The tank assigned to the segment is the diluent.
 * The diver manually holds the setpoint, the needle valve adds oxygen from the oxygen tank at constant flow.
 */
export class MccrBreathing extends ClosedCircuitBreathing {
    protected readonly circuitName = 'mCCR';

    /** The diver holds one setpoint during the whole dive */
    protected setpoint(): number {
        return this.options.setpoint;
    }

    protected oxygenRate(): number {
        return Rebreathers.mccrO2Rate(this.options.o2Flow, this.options.metabolicO2);
    }
}
