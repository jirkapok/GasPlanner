import {
    Options, Segment, StandardGases, Tank, Tanks,
    CalculatedProfile, Ceiling, EventType, Event, Events, Gas
} from 'scuba-physics';

export interface ProfileRequestDto {
    tanks: TankDto[];
    plan: SegmentDto[];
    options: Options;
}

export interface ProfileResultDto {
    profile: CalculatedProfileDto;
    events: EventDto[];
}

export interface EventDto {
    timeStamp: number;
    depth: number;
    type: EventType;
    message?: string;
    gas?: GasDto;
}

export interface CalculatedProfileDto {
    segments: SegmentDto[];
    ceilings: Ceiling[];
    errors: EventDto[];
}

export interface ConsumptionRequestDto {
    plan: SegmentDto[];
    profile: SegmentDto[];
    options: Options;
    diver: DiverDto;
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
    gas: GasDto;
}

export interface GasDto {
    fO2: number;
    fHe: number;
}

export interface DiverDto {
    rmv: number;
}

/** Serialization used to store preferences and for communication with background workers */
export class DtoSerialization {
    public static toTanks(source: TankDto[]): Tank[] {
        const result: Tank[] = [];
        source.forEach(tank => {
            const converted = new Tank(tank.size, tank.startPressure, 0);
            converted.id = tank.id;
            converted.consumed = tank.consumed;
            converted.reserve = tank.reserve;
            converted.gas.fO2 = tank.gas.fO2;
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
                    fO2: tank.gas.fO2,
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
            gas.fO2 = loaded.gas.fO2; // segment always has gas
            gas.fHe = loaded.gas.fHe;
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
                tankId: tankId,
                gas: {
                    fO2: segment.gas.fO2,
                    fHe: segment.gas.fHe
                }
            };
            result.push(serialized);
        });
        return result;
    }

    public static toProfile(profile: CalculatedProfileDto, tanks: Tank[]): CalculatedProfile {
        const segments = DtoSerialization.toSegments(profile.segments, tanks);
        // ceilings have simple data, no custom conversion needed
        return CalculatedProfile.fromProfile(segments, profile.ceilings);
    }

    public static fromProfile(profile: CalculatedProfile): CalculatedProfileDto {
        const segments = DtoSerialization.fromSegments(profile.segments);

        return {
            segments: segments,
            ceilings: profile.ceilings,
            errors: DtoSerialization.toEvents(profile.errors)
        };
    }

    public static fromEvents(dto: EventDto[]): Events {
        const result = new Events();
        dto.forEach(d => {
            const e = new Event(d.timeStamp, d.depth, d.type, d.message);
            if(d.gas) {
                e.gas = new Gas(d.gas?.fO2, d.gas?.fHe);
            }

            result.add(e);
        });
        return result;
    }

    public static toEvents(events: Event[]): EventDto[] {
        const result: EventDto[] = [];
        events.forEach(e => {
            const dto: EventDto = {
                timeStamp: e.timeStamp,
                depth: e.depth,
                type: e.type,
                message: e.message,
            };

            if(e.gas) {
                dto.gas = {
                    fO2: e.gas.fO2,
                    fHe: e.gas.fHe,
                };
            }
            result.push(dto);
        });
        return result;
    }
}
