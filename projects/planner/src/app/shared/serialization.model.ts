import { Diver, Options, Segment, StandardGases, Tank, Tanks, Event, CalculatedProfile, Events, Ceiling } from 'scuba-physics';

export interface ProfileRequestDto {
    tanks: TankDto[];
    plan: SegmentDto[];
    options: Options;
}

export interface ProfileResultDto {
    profile: CalculatedProfileDto;
    events: Events;
}

export interface CalculatedProfileDto {
    segments: SegmentDto[];
    ceilings: Ceiling[];
    errors: Event[];
}

export interface ConsumptionRequestDto {
    plan: SegmentDto[];
    profile: SegmentDto[];
    options: Options;
    diver: Diver;
    tanks: TankDto[];
}

export interface ConsumptionResultDto {
    maxTime: number;
    timeToSurface: number;
    tanks: TankDto[];
}

export interface TankDto {
    id: number;
    size: number;
    startPressure: number;
    consumed: number;
    reserve: number;
    gas: GasDto;
}

export interface SegmentDto {
    startDepth: number;
    endDepth: number;
    duration: number;
    tankId: number;
}

export interface GasDto {
    fo2: number;
    fHe: number;
}

export class DtoSerialization {
    public static toTanks(source: TankDto[]): Tank[] {
        const result: Tank[] = [];
        source.forEach(tank => {
            const converted = new Tank(tank.size, tank.startPressure, 0);
            converted.id = tank.id;
            converted.consumed = tank.consumed;
            converted.reserve = tank.reserve;
            converted.gas.fO2 = tank.gas.fo2;
            converted.gas.fHe = tank.gas.fHe;
            result.push(converted);
        });

        Tanks.renumberIds(result);
        return result;
    }

    public static fromTanks(tanks: Tank[]): TankDto[] {
        const result: TankDto[] = [];
        tanks.forEach(tank => {
            const serialized: TankDto = {
                id: tank.id,
                size: tank.size,
                startPressure: tank.startPressure,
                consumed: tank.consumed,
                reserve: tank.reserve,
                gas: {
                    fo2: tank.gas.fO2,
                    fHe: tank.gas.fHe
                }
            };
            result.push(serialized);
        });
        return result;
    }

    public static toSegments(source: SegmentDto[], tanks: Tank[]): Segment[] {
        const result: Segment[] = [];

        for (let index = 0; index < source.length; index++) {
            const loaded = source[index];
            const gas = StandardGases.air.copy();
            const converted = new Segment(loaded.startDepth, loaded.endDepth, gas, loaded.duration);

            if (loaded.tankId > 0 && loaded.tankId <= tanks.length) {
                const tankIndex = loaded.tankId - 1;
                converted.tank = tanks[tankIndex];
            }

            result.push(converted);
        }

        return result;
    }

    public static fromSegments(plan: Segment[]): SegmentDto[] {
        const result: SegmentDto[] = [];
        plan.forEach(segment => {
            const tankId = segment.tank ? segment.tank.id : 0;
            const serialized: SegmentDto = {
                startDepth: segment.startDepth,
                endDepth: segment.endDepth,
                duration: segment.duration,
                tankId: tankId
            };
            result.push(serialized);
        });
        return result;
    }

    public static toProfile(profile: CalculatedProfileDto, tanks: Tank[]): CalculatedProfile {
        const segments = DtoSerialization.toSegments(profile.segments, tanks);
        return CalculatedProfile.fromProfile(segments, profile.ceilings);
    }

    public static fromProfile(profile: CalculatedProfile): CalculatedProfileDto {
        const segments = DtoSerialization.fromSegments(profile.segments);

        return {
            segments: segments,
            ceilings: profile.ceilings,
            errors: profile.errors
        };
    }
}
