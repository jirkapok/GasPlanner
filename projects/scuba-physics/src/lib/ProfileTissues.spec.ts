import { ProfileTissues } from "./ProfileTissues";
import { LoadSegment, Tissues } from "./Tissues";
import { StandardGases } from "./StandardGases";
import { Time } from "./Time";

describe('Profile tissues', () => {
    const sut = new ProfileTissues();
    const surfacePressure = 1;

    describe('Surface gradient', () => {
        it('Not loaded at surface Is 0 %', () => {
            const loadedTissues = Tissues.create(surfacePressure).finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBe(0);
        });

        it('Is 25.6 % when loaded 20 min. at 20 m', () => {
            const loadSegment = new LoadSegment(2, Time.oneMinute * 20, 0);
            const tissues = Tissues.create(surfacePressure);
            tissues.load(loadSegment, StandardGases.air);
            const loadedTissues = tissues.finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBeCloseTo(0.255723, 6);
        });

        it('Loaded at altitude is still 0 %', () => {
            const altitudePressure = 0.8;
            const loadedTissues = Tissues.create(altitudePressure).finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBe(0);
        });
    });
});
