import { LoadedTissue, LoadedTissues, ProfileTissues } from 'scuba-physics';
import { DtoSerialization } from './dtoSerialization';

describe('DtoSerialization tissues history', () => {
    /** Every compartment of every sample has different values */
    const sampleAt = (index: number): LoadedTissues =>
        ProfileTissues.createAtSurface(0).map((t: LoadedTissue, compartment: number) => ({
            pN2: index + compartment / 100,
            pHe: index + compartment / 1000
        })) as LoadedTissues;

    const history = [sampleAt(1), sampleAt(2), sampleAt(3)];

    it('Packs every compartment of every sample', () => {
        const packed = DtoSerialization.packTissuesHistory(history);
        expect(packed.length).toEqual(3 * DtoSerialization.valuesPerTissuesSample);
        expect(DtoSerialization.tissuesHistorySamples(packed)).toEqual(3);
    });

    it('Packs nitrogen and helium of compartments in order', () => {
        const packed = DtoSerialization.packTissuesHistory(history);
        expect(Array.from(packed.slice(0, 4))).toEqual([1, 1, 1.01, 1.001]);
    });

    it('Unpacks the same tissues history', () => {
        const unpacked = DtoSerialization.unpackTissuesHistory(DtoSerialization.packTissuesHistory(history));
        expect(unpacked).toEqual(history);
    });

    it('Empty history is packed to empty array', () => {
        const packed = DtoSerialization.packTissuesHistory([]);
        expect(packed.length).toEqual(0);
        expect(DtoSerialization.unpackTissuesHistory(packed)).toEqual([]);
    });

    it('Packed history survives the transfer to the worker', () => {
        const transferred = structuredClone(DtoSerialization.packTissuesHistory(history));
        expect(DtoSerialization.unpackTissuesHistory(transferred)).toEqual(history);
    });
});
