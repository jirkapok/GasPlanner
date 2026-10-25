import { Mocked, vi } from 'vitest';

/**
 * Creates object containing only the given methods, each one replaced by Vitest mock function.
 * Replacement of the Jasmine `createSpyObj`.
 */
export function createSpyObj<T>(methods: (keyof T)[]): Mocked<T> {
    const spyObj: Partial<Record<keyof T, unknown>> = {};
    for (const method of methods) {
        spyObj[method] = vi.fn();
    }
    return spyObj as Mocked<T>;
}
