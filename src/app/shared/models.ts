export enum StandardGas {
    Air = 21,
    EAN32 = 32,
    EAN36 = 36,
    EAN38 = 38,
    EAN50 = 50,
    OXYGEN = 100
}

export class Gas {
    constructor(public size: number, public startPressure: number, public o2: number) {
    }

    public get volume(): number {
        return this.size * this.startPressure;
    }

    public get mod(): number {
        const maxPpO2 = 1.4;
        const ppO2 = this.o2 / 100;
        const result = 10 * (maxPpO2 / ppO2 - 1);
        return Math.floor(result);
    }

    public get name(): string {
        const fromEnum = StandardGas[this.o2];
        if (fromEnum) {
            return fromEnum;
        }

        return 'EAN' + this.o2.toString();
    }

    public assignStandardGas(standard: string): void {
        this.o2 = StandardGas[standard];
    }

    public loadFrom(other: Gas): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }
}

export class Diver {
    constructor(public sac: number) {
    }

    public loadFrom(other: Diver): void {
        this.sac = other.sac;
    }
}

export enum Strategies {
    ALL_USABLE = 1,
    HALF = 2,
    THIRD = 3
}

export class Plan {
    constructor(public duration: number, public depth: number, public strategy: Strategies) {
    }

    public loadFrom(other: Plan): void {
        this.depth = other.depth;
        this.duration = other.duration;
        this.strategy = other.strategy;
    }
}

export class Gases {
    public current: Gas[] = [this.createGas()];

    public static gasNames(): string[] {
        return Object.keys(StandardGas)
            .filter(k => typeof StandardGas[k] === 'number') as string[];
    }

    public add(): void {
        const newGas = this.createGas();
        this.current.push(newGas);
    }

    private createGas(): Gas {
        return new Gas(15, 200, 21);
    }

    public remove(selected: Gas): void {
        if (this.current.length <= 1) {
            return;
        }

        this.current.forEach((item, index) => {
            if (item === selected) {
                this.current.splice(index, 1);
            }
        });
    }

    public totalVolume(): number {
        let total = 0;
        this.current.forEach(gas => {
            total += gas.volume;
        });
        return total;
    }
}

export class Dive {
    public maxDepth = 0;
    public maxTime = 0;
    public rockBottom = 0;
    public timeToSurface = 0;

    public canRealize(): boolean {
        return this.timeToSurface !== 0;
    }
}
