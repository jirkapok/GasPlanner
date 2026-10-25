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
        // the expect(...) call closes right before the marker
        const expectStart = text.lastIndexOf('expect(', at);
        const expectOpen = expectStart + 'expect'.length;
        if (closingOf(text, expectOpen) !== at - 1) {
            throw new Error('withContext not directly after expect at ' + at);
        }
        text = text.substring(0, at - 1) + ', ' + message + ')' + text.substring(argClose + 1);
        at = text.indexOf(marker);
    }
    return text;
};

const simple: [RegExp, string][] = [
    [/\.toBeTrue\(\)/g, '.toBe(true)'],
    [/\.toBeFalse\(\)/g, '.toBe(false)'],
];

let changed = 0;
for (const file of specFiles(process.argv[2])) {
    const source = readFileSync(file, 'utf8');
    let text = source;
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
