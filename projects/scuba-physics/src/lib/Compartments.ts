export class Compartment {

    constructor(private _n2HalfTime: number, private _n2A: number, private _n2B: number,
        private _heHalfTime: number, private _heA: number, private _heB: number) { }

    public get n2HalfTime(): number {
        return this._n2HalfTime;
    }

    public get n2A(): number {
        return this._n2A;
    }

    public get n2B(): number {
        return this._n2B;
    }

    public get heHalfTime(): number {
        return this._heHalfTime;
    }

    public get heA(): number {
        return this._heA;
    }

    public get heB(): number {
        return this._heB;
    }
}

export class Compartments {
    /**
    *  Removed 1, used 1b compartment instead
    *  Verified by subsuface, wiki and http://www.nigelhewitt.co.uk/stuff/aab.jpg
    *  Using values from Subsurface
    *  Not implementing version A (not conservative), nor B (for tables)
    */
    public static readonly Buhlmann_ZHL16C: Compartment[] = [
        new Compartment(5.0, 1.1696, 0.5578, 1.88, 1.6189, 0.4770),
        new Compartment(8.0, 1.0000, 0.6514, 3.02, 1.3830, 0.5747),
        new Compartment(12.5, 0.8618, 0.7222, 4.72, 1.1919, 0.6527),
        new Compartment(18.5, 0.7562, 0.7826, 6.99, 1.0458, 0.7223),
        new Compartment(27.0, 0.62, 0.8125, 10.21, 0.9220, 0.7582),
        new Compartment(38.3, 0.5043, 0.8434, 14.48, 0.8205, 0.7957),
        new Compartment(54.3, 0.441, 0.8693, 20.53, 0.7305, 0.8279),
        new Compartment(77.0, 0.4, 0.8910, 29.11, 0.6502, 0.8553),
        new Compartment(109.0, 0.375, 0.9092, 41.20, 0.5950, 0.8757),
        new Compartment(146.0, 0.35, 0.9222, 55.19, 0.5545, 0.8903),
        new Compartment(187.0, 0.3295, 0.9319, 70.69, 0.5333, 0.8997),
        new Compartment(239.0, 0.3065, 0.9403, 90.34, 0.5189, 0.9073),
        new Compartment(305.0, 0.2835, 0.9477, 115.29, 0.5181, 0.9122),
        new Compartment(390.0, 0.261, 0.9544, 147.42, 0.5176, 0.9171),
        new Compartment(498.0, 0.248, 0.9602, 188.24, 0.5172, 0.9217),
        new Compartment(635.0, 0.2327, 0.9653, 240.03, 0.5119, 0.9267)
    ];
}
