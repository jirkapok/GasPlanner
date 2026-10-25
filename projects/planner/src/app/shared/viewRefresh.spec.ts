import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockInstance } from 'vitest';
import { ViewRefresh } from './viewRefresh';

describe('ViewRefresh', () => {
    let sut: ViewRefresh;
    let tick: MockInstance<() => void>;

    beforeEach(() => {
        sut = TestBed.inject(ViewRefresh);
        tick = vi.spyOn(TestBed.inject(ApplicationRef), 'tick').mockImplementation(() => {});
    });

    it('does not tick synchronously', () => {
        sut.refresh();
        expect(tick).not.toHaveBeenCalled();
    });

    it('ticks once after microtask', async () => {
        sut.refresh();
        await Promise.resolve();
        expect(tick).toHaveBeenCalledTimes(1);
    });

    it('coalesces calls in one tick', async () => {
        sut.refresh();
        sut.refresh();
        sut.refresh();
        await Promise.resolve();
        expect(tick).toHaveBeenCalledTimes(1);
    });

    it('ticks again after previous refresh finished', async () => {
        sut.refresh();
        await Promise.resolve();
        sut.refresh();
        await Promise.resolve();
        expect(tick).toHaveBeenCalledTimes(2);
    });
});
