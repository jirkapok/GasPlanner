import { executeCommand } from './commands';

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
