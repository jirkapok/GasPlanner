import { serverVersion } from './version';

export interface CommandResult {
    /** 0 success, 1 invalid input, 2 invalid usage */
    exitCode: number;
    /** Text printed to the standard output */
    output: string;
}

const usage = `Usage: dugong <command> [--input <file>]
Version: ${serverVersion}
Reads the command input as JSON from the file or from the standard input.
Commands: none available yet
`;

/** Runs the Skill command line command, without any access to the console or files */
export const executeCommand = (command: string | undefined, input: string): CommandResult => {
    // the input is used by commands added later
    void input;

    switch (command) {
        default:
            return { exitCode: 2, output: usage };
    }
};
