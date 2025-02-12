import { GasMix, RealBlender } from './realGasBlender';

describe('Real Gas blender', () => {
    it('Glend Trimix', () => {
        // Current tank pressure -
        const pi = 0;
        const gasi = new GasMix(21, 0);
        // Required/Final tank pressure -
        const pf = 200;
        const gasf = new GasMix(25, 25);
        // First top mix -
        const gas1 = new GasMix(100, 0);
        // Second top mix -
        const gas2 = new GasMix(0, 100);
        // Third top mix -
        const gas3 = new GasMix(21, 0);


        const result =new RealBlender().blend(pi, gasi, pf, gasf, gas1, gas2, gas3);
        const expected = `
Start with 0.0 bar of AIR.
Top up with EAN100 up to 22.2 bar and end up with EAN100.
Then top up with TMX 0/100 up to 71.3 bar and end up with TMX 32/68.
Finally, top up with AIR up to 200.0 bar and end up with TMX 25/25.
Use 22.5 litres of EAN100
48.0 litres of TMX 0/100 and
121.6 litres of AIR per litre of cylinder volume.`;

        expect(result).toEqual(expected);
    });

    it('Blend Nitrox', () => {
        // Current tank pressure -
        const pi = 50;
        const gasi = new GasMix(21, 0);
        // Required/Final tank pressure -
        const pf = 200;
        const gasf = new GasMix(32, 0);
        // First top mix -
        const gas1 = new GasMix(100, 0);
        // Second top mix - not used
        const gas2 = new GasMix(99, 99);
        // Third top mix -
        const gas3 = new GasMix(21, 0);

        const result =new RealBlender().blend(pi, gasi, pf, gasf, gas1, gas2, gas3);
        const expected = `
Start with 50.0 bar of AIR.
Top up with EAN100 up to 76.1 bar and end up with EAN49.
Finally, top up with AIR up to 200.0 bar and end up with EAN32.
Use 27.2 litres of EAN100 and 117.5 litres of AIR per litre of cylinder volume.`;

        expect(result).toEqual(expected);
    });
});
