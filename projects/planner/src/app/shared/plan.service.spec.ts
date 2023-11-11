import {Options, Segment, Tank} from 'scuba-physics';
import { Plan } from './plan.service';

describe('Plan service', () => {

    it('Does not load empty plan', () => {
        const plan = new Plan();
        plan.assignDepth(30, Tank.createDefault(), new Options());
        const segments: Segment[] = [];
        plan.loadFrom(segments);
        expect(plan.length).toBe(2);
    });
});
