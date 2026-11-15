import exampleInput from '../../skill/examples/air-30m.json';
import { executeCommand } from './commands';
import { planDive } from './planDive';
import { planDiveInputSchema } from './planDiveInput';

describe('Skill commands', () => {
    it('prints usage for missing command', () => {
        const result = executeCommand(undefined, '');
        expect(result.exitCode).toBe(2);
        expect(result.output).toMatch(/^Usage: dugong <command>/);
    });

    it('prints usage for unknown command', () => {
        const result = executeCommand('unknown', '');
        expect(result.exitCode).toBe(2);
        expect(result.output).toMatch(/^Usage: dugong <command>/);
    });
});

describe('plan_dive command', () => {
    const air18m20min = { depth: 18, bottomTime: 20, tanks: [{ size: 15, startPressure: 200, o2: 21 }] };

    it('plans dive from json input', () => {
        const result = executeCommand('plan_dive', JSON.stringify(air18m20min));
        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.output)).toEqual(planDive(air18m20min));
    });

    it('prints validation errors', () => {
        const result = executeCommand('plan_dive', JSON.stringify({ ...air18m20min, depth: 0 }));
        expect(result.exitCode).toBe(1);
        expect((JSON.parse(result.output) as { errors: string[] }).errors[0]).toMatch(/^depth: /);
    });

    it('prints error for invalid json', () => {
        const result = executeCommand('plan_dive', '{');
        expect(result.exitCode).toBe(1);
        expect((JSON.parse(result.output) as { errors: string[] }).errors.length).toBe(1);
    });

    it('example input is valid', () => {
        expect(planDiveInputSchema.safeParse(exampleInput).success).toBe(true);
    });

    it('usage lists the plan_dive command', () => {
        expect(executeCommand(undefined, '').output).toContain('plan_dive');
    });
});
