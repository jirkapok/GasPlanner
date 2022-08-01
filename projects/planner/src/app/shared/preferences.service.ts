import { Injectable } from '@angular/core';
import { Diver, Options } from 'scuba-physics';
import { PlannerService } from './planner.service';
import { DtoSerialization, SegmentDto, TankDto } from './serialization.model';

export interface AppPreferences  {
    isComplex: boolean;
    options: Options;
    diver: Diver;
    tanks: TankDto[];
    plan: SegmentDto[];
}

export class PreferencesFactory {
    public static toPreferences(planner: PlannerService): AppPreferences {
        return {
            isComplex: planner.isComplex,
            options: planner.options,
            diver: planner.diver,
            tanks: DtoSerialization.fromTanks(planner.tanks),
            plan: DtoSerialization.fromSegments(planner.plan.segments),
        };
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
        const tanks = DtoSerialization.toTanks(loaded.tanks);
        const segments = DtoSerialization.toSegments(loaded.plan, tanks);
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
