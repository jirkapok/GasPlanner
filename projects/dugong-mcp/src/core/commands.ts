import { planDive } from './planDive';
import { planDiveInputSchema } from './planDiveInput';
import { serverVersion } from './version';

export interface CommandResult {
    /** 0 success, 1 invalid input, 2 invalid usage */
    exitCode: number;
    /** Text printed to the standard output */
    output: string;
}

const usage = `Usage: dugong <command> [--input <file>]
Version: ${serverVersion}
Reads the command input as JSON from the file or from the standard input and prints the result as JSON.
Commands:
  plan_dive  Plans a single level open circuit dive, see SKILL.md for the input and output.
`;

const toJson = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';

const invalidInput = (errors: string[]): CommandResult => ({ exitCode: 1, output: toJson({ errors }) });

const planDiveCommand = (input: string): CommandResult => {
    let json: unknown;
    try {
        json = JSON.parse(input);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return invalidInput([`Input is not valid JSON: ${reason}`]);
    }

    const parsed = planDiveInputSchema.safeParse(json);
    if (!parsed.success) {
        return invalidInput(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
    }

    return { exitCode: 0, output: toJson(planDive(parsed.data)) };
};

/** Runs the Skill command line command, without any access to the console or files */
export const executeCommand = (command: string | undefined, input: string): CommandResult => {
    switch (command) {
        case 'plan_dive':
            return planDiveCommand(input);
        default:
            return { exitCode: 2, output: usage };
    }
};
