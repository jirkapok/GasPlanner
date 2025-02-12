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


        new Compressibility().blend(pi, o2i, hei,
            pf, o2f, hef,
            o21, he1,
            o22, he2,
            o23, he3);

        expect(true).toBeTruthy();
    });
});
