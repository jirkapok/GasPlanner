// Formatting preserving Jasmine -> Vitest text codemod used by the Karma -> Vitest migration (.claude/plans/vitest-migration.md).
// Usage: node build/jasmine2vitest.ts <dir>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const specFiles = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
        return specFiles(path);
    }
    return path.endsWith('.spec.ts') ? [path] : [];
});

/** index of the closing bracket matching the opening one at `open` */
const closingOf = (text: string, open: number): number => {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    let quote = '';
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') {
                i++;
            } else if (c === quote) {
                quote = '';
            }
            continue;
        }
        if (c === '\'' || c === '"' || c === '`') {
            quote = c;
        } else if (pairs[c]) {
            stack.push(pairs[c]);
        } else if (c === stack[stack.length - 1]) {
            stack.pop();
            if (stack.length === 0) {
                return i;
            }
        }
    }
    throw new Error('Unbalanced brackets at ' + open);
};

/** expect(x).withContext(msg). -> expect(x, msg). */
const withContext = (text: string): string => {
    const marker = '.withContext(';
    let at = text.indexOf(marker);
    while (at !== -1) {
        const argOpen = at + marker.length - 1;
        const argClose = closingOf(text, argOpen);
        const message = text.substring(argOpen + 1, argClose);
        // the expect(...) call closes right before the marker, optionally followed by white space
        const expectClose = text.substring(0, at).trimEnd().length - 1;
        const expectStart = text.lastIndexOf('expect(', expectClose);
        const expectOpen = expectStart + 'expect'.length;
        if (closingOf(text, expectOpen) !== expectClose) {
            throw new Error('withContext not directly after expect at ' + at);
        }
        // drop the marker including its leading white space, the next matcher keeps its own line
        text = text.substring(0, expectClose) + ', ' + message + ')' + text.substring(argClose + 1);
        at = text.indexOf(marker);
    }
    return text;
};

/**
 * spyOn(o, 'm') -> vi.spyOn(o, 'm') with the chained `.and.*` strategy.
 * Jasmine spies are stubs by default, Vitest spies call through, so a spy without strategy becomes a stub.
 */
const spies = (text: string): string => {
    const spyPattern = /(?<![.\w])spyOn(Property)?\(/g;
    let match: RegExpExecArray | null;
    while ((match = spyPattern.exec(text)) !== null) {
        const isProperty = match[1] !== undefined;
        const argOpen = match.index + match[0].length - 1;
        const argClose = closingOf(text, argOpen);
        let args = text.substring(argOpen + 1, argClose);
        if (isProperty && !/,\s*'(get|set)'\s*$/.test(args)) {
            args += ', \'get\'';
        }
        let rest = text.substring(argClose + 1);
        const strategy = /^\s*\.and\.(callThrough|returnValue|callFake|throwError)\(/.exec(rest);
        let call = `vi.spyOn(${args})`;
        if (!strategy) {
            call += '.mockImplementation(() => {})';
        } else {
            const strategyOpen = strategy[0].length - 1;
            const strategyClose = closingOf(rest, strategyOpen);
            const strategyArgs = rest.substring(strategyOpen + 1, strategyClose);
            const whitespace = /^\s*/.exec(rest)![0];
            switch (strategy[1]) {
                case 'callThrough':
                    break;
                case 'returnValue':
                    call += `${whitespace}.mockReturnValue(${strategyArgs})`;
                    break;
                case 'callFake':
                    call += `${whitespace}.mockImplementation(${strategyArgs})`;
                    break;
                case 'throwError':
                    call += `${whitespace}.mockImplementation(() => { throw new Error(${strategyArgs}); })`;
                    break;
            }
            rest = rest.substring(strategyClose + 1);
        }
        text = text.substring(0, match.index) + call + rest;
        spyPattern.lastIndex = match.index + call.length;
    }
    return text;
};

const simple: [RegExp, string][] = [
    [/\.toBeTrue\(\)/g, '.toBe(true)'],
    [/\.toBeFalse\(\)/g, '.toBe(false)'],
    [/\.toHaveBeenCalledOnceWith\(/g, '.toHaveBeenCalledExactlyOnceWith('],
    [/jasmine\.objectContaining\(/g, 'expect.objectContaining('],
    [/jasmine\.createSpy\('\w+'\)/g, 'vi.fn()'],
    [/\.and\.returnValue\(/g, '.mockReturnValue('],
    [/\.and\.callFake\(/g, '.mockImplementation('],
    [/\.calls\.reset\(\)/g, '.mockClear()'],
    [/\.calls\.allArgs\(\)/g, '.mock.calls'],
];

let changed = 0;
for (const file of specFiles(process.argv[2])) {
    const source = readFileSync(file, 'utf8');
    let text = spies(source);
    for (const [pattern, replacement] of simple) {
        text = text.replace(pattern, replacement);
    }
    text = withContext(text);
    if (text !== source) {
        writeFileSync(file, text);
        changed++;
    }
}
console.log(`changed ${changed} files`);
