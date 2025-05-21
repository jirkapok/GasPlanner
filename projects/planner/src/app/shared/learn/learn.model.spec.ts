import { NumberVariable } from "./learn.models";

describe('Question variable', () => {
    it('Generates values with expected precision', () => {
        const variable = new NumberVariable("variable", 1.56, 1.56, 5);
        const value = variable.nextRandomValue();
        expect(value).toBeCloseTo(1.56, 5);
    });

    it('Fits value within limits', () => {
        const variable = new NumberVariable("variable", 0.56789, 0.56789, 2);
        const value = variable.nextRandomValue();
        // otherwise the value would be out of defined range by rounding
        expect(value).toBeCloseTo(0.56789, 7);
    });

    it('Rounds generates value', () => {
        spyOn(Math, "random").and.returnValue(0.56789);
        const variable = new NumberVariable("variable", 0, 10, 2);
        const value = variable.nextRandomValue();
        expect(value).toBeCloseTo(5.68, 7);
    });
});
