import { readFileSync } from 'node:fs';
import { executeCommand } from './core/commands';

// Entry point of the Skill command line, no logic here, see executeCommand

const readInput = (cliArgs: string[]): string => {
    const inputIndex = cliArgs.indexOf('--input');
    if (inputIndex >= 0 && inputIndex + 1 < cliArgs.length) {
        return readFileSync(cliArgs[inputIndex + 1], 'utf8');
    }

    return process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
};

const args = process.argv.slice(2);
const result = executeCommand(args[0], readInput(args));
process.stdout.write(result.output);
process.exitCode = result.exitCode;
