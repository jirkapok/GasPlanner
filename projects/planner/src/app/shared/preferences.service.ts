import { Injectable } from '@angular/core';
import { Diver, Gas, Options, Segment, StandardGases, Tank, Tanks } from 'scuba-physics';
import { PlannerService } from './planner.service';

export interface AppPreferences  {
    isComplex: boolean;
    options: Options;
    diver: Diver;
    tanks: TankPreferences[];
    plan: SegmentPreferences[];
}

export interface TankPreferences {
    id: number;
    size: number;
    startPressure: number;
    gas: GasPreferences;
}

export interface SegmentPreferences {
    startDepth: number;
    endDepth: number;
    duration: number;
    tankId: number;
}

export interface GasPreferences {
    fo2: number;
    fHe: number;
}

export class PreferencesFactory {
    public static toTanks(source: TankPreferences[]): Tank[] {
        const result: Tank[]  = [];
        source.forEach(tank => {
            const converted = new Tank(tank.size, tank.startPressure, 0);
            converted.id = tank.id;
            converted.gas.fO2 = tank.gas.fo2;
            converted.gas.fHe = tank.gas.fHe;
            result.push(converted);
        });

        Tanks.renumberIds(result);
        return result;
    }

    public static toSegments(source: SegmentPreferences[], tanks: Tank[]): Segment[] {
        const result: Segment[] = [];

        for (let index = 0; index < source.length; index++) {
            const loaded = source[index];
            const gas = StandardGases.air.copy();
            const converted = new Segment(loaded.startDepth, loaded.endDepth, gas, loaded.duration);
            let tankIndex = 0;

            if (loaded.tankId <= tanks.length) {
                tankIndex = loaded.tankId - 1;
            }

            converted.tank = tanks[tankIndex];
            result.push(converted);
        }

        return result;
    }

    public static toPreferences(planner: PlannerService): AppPreferences {
        return {
            isComplex: planner.isComplex,
            options: planner.options,
            diver: planner.diver,
            tanks: PreferencesFactory.toTankPreferences(planner.tanks),
            plan: PreferencesFactory.toSegmentPreferences(planner.plan.segments),
        };
    }

    private static toTankPreferences(tanks: Tank[]): TankPreferences[] {
        const result: TankPreferences[]  = [];
        tanks.forEach(tank => {
            const serialized: TankPreferences = {
                id: tank.id,
                size: tank.size,
                startPressure: tank.startPressure,
                gas: {
                    fo2: tank.gas.fO2,
                    fHe: tank.gas.fHe
                }
            };
            result.push(serialized);
        });
        return result;
    }

    private static toSegmentPreferences(plan: Segment[]): SegmentPreferences[] {
        const result: SegmentPreferences[]  = [];
        plan.forEach(segment => {
            const tankId = segment.tank ? segment.tank.id : 1;
            const serialized: SegmentPreferences = {
                startDepth: segment.startDepth,
                endDepth: segment.endDepth,
                duration: segment.duration,
                tankId: tankId
            };
            result.push(serialized);
        });
        return result;
    }
}

@Injectable({
    providedIn: 'root'
})
export class PreferencesService {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly disclaimerKey = 'disclaimer';

    constructor(private planner: PlannerService) { }

    public loadDefaults(): void {
        const toParse = localStorage.getItem(PreferencesService.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        const tanks = PreferencesFactory.toTanks(loaded.tanks);
        const segments = PreferencesFactory.toSegments(loaded.plan, tanks);
        this.planner.loadFrom(loaded.isComplex, loaded.options, loaded.diver, tanks, segments);
    }

    public saveDefaults(): void {
        const toSave = PreferencesFactory.toPreferences(this.planner);
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesService.storageKey, serialized);
    }

    public disableDisclaimer(): void {
        localStorage.setItem(PreferencesService.disclaimerKey, PreferencesService.disclaimerValue);
    }

    public disclaimerEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesService.disclaimerKey);
        return saved !== PreferencesService.disclaimerValue;
    }
}
