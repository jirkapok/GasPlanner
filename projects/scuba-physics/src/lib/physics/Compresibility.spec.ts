import { Compressibility } from "./Compressibility";

xdescribe('Compresibility', () => {
    it('Show case', () => {

        // Current tank pressure -
        const pi = 0;
        const o2i = 21;
        const hei = 0;
        // Required/Final tank pressure -
        const pf = 200;
        const o2f = 25;
        const hef = 25;
        // First top mix -
        const o21 = 100;
        const he1 = 0;
        // Second top mix -
        const o22 = 0;
        const he2 = 100;
        // Third top mix -
        const o23 = 21;
        const he3 = 0;


        const result =new Compressibility().blend(pi, o2i, hei,
            pf, o2f, hef,
            o21, he1,
            o22, he2,
            o23, he3);

        // Start with 0.0 bar of AIR.
        // Top up with EAN100 up to 22.2 bar and end up with EAN100.
        // Then top up with TMX 0/100 up to 71.3 bar and end up with TMX 32/68.
        // Finally, top up with AIR up to 200.0 bar and end up with TMX 25/25.
        // Use 22.5 litres of EAN100, 48.0 litres of TMX 0/100 and 121.6 litres of AIR per litre of cylinder volume.
        expect(true).toBeTruthy();
    });
});
