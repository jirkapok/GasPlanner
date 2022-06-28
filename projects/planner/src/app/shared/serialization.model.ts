import { Diver, Options, Segment, StandardGases, Tank, Tanks } from 'scuba-physics';

export interface NoDecoRequestDto {
    tanks: TankDto[];
    originProfile: SegmentDto[];
    options: Options;
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
    tanks: TankConsumedDto[];
}

export interface TankConsumedDto {
    id: number;
    consumed: number;
    reserve: number;
}

export interface TankDto {
    id: number;
    size: number;
    startPressure: number;
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
            converted.gas.fO2 = tank.gas.fo2;
            converted.gas.fHe = tank.gas.fHe;
            result.push(converted);
        });

        Tanks.renumberIds(result);
        return result;
    }

    public static toSegments(source: SegmentDto[], tanks: Tank[]): Segment[] {
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

    public static toTanksConsumption(tanks: Tank[]): TankConsumedDto[] {
        const result: TankConsumedDto[] = [];
        tanks.forEach(tank => {
            const serialized: TankConsumedDto = {
                id: tank.id,
                consumed: tank.consumed,
                reserve: tank.reserve
            };
            result.push(serialized);
        });
        return result;
    }

    public static toTankPreferences(tanks: Tank[]): TankDto[] {
        const result: TankDto[] = [];
        tanks.forEach(tank => {
            const serialized: TankDto = {
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

    public static toSegmentPreferences(plan: Segment[]): SegmentDto[] {
        const result: SegmentDto[] = [];
        plan.forEach(segment => {
            const tankId = segment.tank ? segment.tank.id : 1;
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
}
