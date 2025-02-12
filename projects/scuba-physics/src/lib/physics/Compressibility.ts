interface GasMix {
    o2: number;
    he: number;
}

export class Compressibility {
    private readonly o2Coefficients = [-7.18092073703e-4, 2.81852572808e-6, -1.50290620492e-9];
    private readonly n2Coefficients = [-2.19260353292e-4, 2.92844845532e-6, -2.07613482075e-9];
    private readonly heCoefficients = [4.87320026468e-4, -8.83632921053e-8, 5.33304543646e-11];

    private fo2(gasmix: GasMix): number {
        return gasmix.o2 / 100;
    }

    private fhe(gasmix: GasMix): number {
        return gasmix.he / 100;
    }

    private fn2(gasmix: GasMix): number {
        return (100 - gasmix.o2 - gasmix.he) / 100;
    }

    private virial(p: number, coef: number[]): number {
        return coef[0] * p + coef[1] * p * p + coef[2] * p * p * p;
    }

    private zfactor(p: number, gasmix: GasMix): number {
        return (
            1 +
            this.fo2(gasmix) * this.virial(p, this.o2Coefficients) +
            this.fhe(gasmix) * this.virial(p, this.heCoefficients) +
            this.fn2(gasmix) * this.virial(p, this.n2Coefficients)
        );
    }

    private normalVolumeFactor(p: number, gasmix: GasMix): number {
        return (p * this.zfactor(1, gasmix)) / this.zfactor(p, gasmix);
    }

    private trimix(o2: number, he: number): GasMix {
        return { o2, he };
    }

    private nitrox(o2: number): GasMix {
        return this.trimix(o2, 0);
    }

    private air(): GasMix {
        return this.nitrox(21);
    }

    private findP(mix: GasMix, originalV: number): number {
        let p = originalV;
        while (Math.abs(this.zfactor(1, mix) * p - this.zfactor(p, mix) * originalV) > 0.000001) {
            p = (originalV * this.zfactor(p, mix)) / this.zfactor(1, mix);
        }
        return p;
    }

    private gasName(mix: GasMix): string {
        if (this.fhe(mix)) {
            return `TMX ${Math.round(this.fo2(mix) * 100)}/${Math.round(this.fhe(mix) * 100)}`;
        } else {
            return this.fo2(mix) === this.fo2(this.air()) ? "AIR" : `EAN${Math.round(this.fo2(mix) * 100)}`;
        }
    }

    private r(v: number): string {
        return v.toFixed(1);
    }

    public blend(pi: number, o2i: number, hei: number,
                 pf: number, o2f: number, hef: number,
                 o21: number, he1: number,
                 o22: number, he2: number,
                 o23: number, he3: number): string {

        const gasi = this.trimix(o2i, hei);
        const gas1 = this.trimix(o21, he1);
        const gas2 = this.trimix(o22, he2);
        const gas3 = this.trimix(o23, he3);
        const gasf = this.trimix(o2f, hef);

        if (o2i) {
            if (hef > 0) {
                return this.blendTrimix(pi, pf, gasi, gas1, gas2, gas3, gasf);
            } else {
                return this.blendNitrox();
            }
        } else {
            return "Missing parameters";
        }
    }

    private blendTrimix(pi: number, pf: number, gasi: GasMix, gas1: GasMix, gas2: GasMix, gas3: GasMix, gasf: GasMix): string {
        const det =   this.fhe(gas3) * this.fn2(gas2) * this.fo2(gas1)
                            - this.fhe(gas2) * this.fn2(gas3) * this.fo2(gas1)
                            - this.fhe(gas3) * this.fn2(gas1) * this.fo2(gas2)
                            + this.fhe(gas1) * this.fn2(gas3) * this.fo2(gas2)
                            + this.fhe(gas2) * this.fn2(gas1) * this.fo2(gas3)
                            - this.fhe(gas1) * this.fn2(gas2) * this.fo2(gas3);

        if (det) {
            return "Cannot mix with degenerate gases!\n";
        }

        const ivol = this.normalVolumeFactor(pi, gasi);
        const fvol = this.normalVolumeFactor(pf, gasf);

        const top1 = ((this.fn2(gas3) * this.fo2(gas2) - this.fn2(gas2) * this.fo2(gas3)) * (this.fhe(gasf) * fvol - this.fhe(gasi) * ivol)
        + (this.fhe(gas2) * this.fo2(gas3) - this.fhe(gas3) * this.fo2(gas2)) * (this.fn2(gasf) * fvol - this.fn2(gasi) * ivol)
        + (this.fhe(gas3) * this.fn2(gas2) - this.fhe(gas2) * this.fn2(gas3)) * (this.fo2(gasf) * fvol - this.fo2(gasi) * ivol)) / det;

        const top2 = ((this.fn2(gas1) * this.fo2(gas3) - this.fn2(gas3) * this.fo2(gas1)) * (this.fhe(gasf) * fvol - this.fhe(gasi) * ivol)
        + (this.fhe(gas3) * this.fo2(gas1) - this.fhe(gas1) * this.fo2(gas3)) * (this.fn2(gasf) * fvol - this.fn2(gasi) * ivol)
        + (this.fhe(gas1) * this.fn2(gas3) - this.fhe(gas3) * this.fn2(gas1)) * (this.fo2(gasf) * fvol - this.fo2(gasi) * ivol)) / det;

        const top3 = ((this.fn2(gas2) * this.fo2(gas1) - this.fn2(gas1) * this.fo2(gas2)) * (this.fhe(gasf) * fvol - this.fhe(gasi) * ivol)
        + (this.fhe(gas1) * this.fo2(gas2) - this.fhe(gas2) * this.fo2(gas1)) * (this.fn2(gasf) * fvol - this.fn2(gasi) * ivol)
        + (this.fhe(gas2) * this.fn2(gas1) - this.fhe(gas1) * this.fn2(gas2)) * (this.fo2(gasf) * fvol - this.fo2(gasi) * ivol)) / det;

        if (top1 < 0 || top2 < 0 || top3 < 0) {
            return `Impossible to blend ", ${this.gasName(gasf)}, " with these gases!\n`;
        }

        const newmix1 = this.trimix(100 * (this.fo2(gasi) * ivol + this.fo2(gas1) * top1) / (ivol + top1),
        100 * (this.fhe(gasi) * ivol + this.fhe(gas1) * top1) / (ivol + top1));

        const p1 = this.findP(newmix1, ivol + top1);

        const newmix2 = this.trimix(100 * (this.fo2(gasi) * ivol + this.fo2(gas1) * top1 + this.fo2(gas2) * top2) / (ivol + top1 + top2),
        100 * (this.fhe(gasi) * ivol + this.fhe(gas1) * top1 + this.fhe(gas2) * top2) / (ivol + top1 + top2));

        const p2 = this.findP(newmix2, ivol + top1 + top2);


        return p2.toString();
    }

    private blendNitrox(): string {
        return "";
    }

    private blendElse(): string {
        return "Only print params";
    }
}
