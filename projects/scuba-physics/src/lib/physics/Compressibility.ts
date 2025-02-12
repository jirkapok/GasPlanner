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
}
