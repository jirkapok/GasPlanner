import { ClosedCircuitBreathing } from './ClosedCircuitBreathing';
import { Rebreathers } from './Rebreathers';

/**
 * Electronic closed circuit rebreather. The tank assigned to the segment is the diluent.
 * The electronics hold the descent setpoint shallower than the switch depth, the bottom setpoint deeper
 * and the deco setpoint from the deepest point of the dive. Oxygen used is the metabolic consumption including losses.
 */
export class EccrBreathing extends ClosedCircuitBreathing {
    protected readonly circuitName = 'eCCR';

    protected setpoint(depth: number, isAscent: boolean): number {
        if (isAscent) {
            return this.options.decoSetpoint;
        }

        if (depth < this.options.setpointSwitchDepth) {
            return this.options.descentSetpoint;
        }

        return this.options.bottomSetpoint;
    }

    protected oxygenRate(): number {
        return Rebreathers.eccrO2Rate(this.options.metabolicO2, this.options.o2Loss);
    }
}
