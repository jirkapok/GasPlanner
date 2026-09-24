import { Injectable } from '@angular/core';
import { OptionDefaults } from 'scuba-physics';

export class Gradients {
    constructor(public gfLow: number, public gfHeigh: number) {}
}

@Injectable()
export class StandardGradientsService {
    public readonly lowName = 'gradients.low';
    public readonly mediumName = 'gradients.medium';
    public readonly highName = 'gradients.high';
    private empty = new Gradients(1, 1);

    private gfMap = new Map<string, Gradients>();

    constructor() {
        this.gfMap.set(this.lowName, new Gradients(0.45, 0.95));
        this.gfMap.set(this.mediumName, new Gradients(OptionDefaults.gfLow, OptionDefaults.gfHigh));
        this.gfMap.set(this.highName, new Gradients(0.30, 0.75));
    }

    public labelFor(gfLow: number, gfHigh: number): string {
        for (const key of this.gfMap.keys()) {
            const entry = this.gfMap.get(key) || this.empty;
            if(entry.gfLow === gfLow && entry.gfHeigh === gfHigh) {
                return key;
            }
        }

        return '';
    }

    public get(label: string): Gradients {
        return this.gfMap.get(label) || this.empty;
    }
}
