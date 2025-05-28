import { Compressibility } from '../physics/compressibility';
import { Gas } from '../gases/Gases';
import { GasMixtures } from '../gases/GasMixtures';

/** Custom Gas mix crate for the blender, because rounding issues result in different number, when using partials directly */
export class GasMix {
    public static readonly air: GasMix  = new GasMix(21, 0);

    public _fO2: number;
    public _fHe: number;

    constructor(o2: number, he: number = 0) {
        this._fO2 = o2 / 100;
        this._fHe = he / 100;
    }

    public get fO2(): number {
        return this._fO2;
    }

    public get fHe(): number {
        return this._fHe;
    }

    public get fN2(): number {
        return GasMixtures.n2(this.fO2, this.fHe);
    }

    public get name(): string {
        if (this.fHe > 0) {
            return `TMX ${Math.round(this.fO2 * 100)}/${Math.round(this.fHe * 100)}`;
        } else {
            return this.fO2 === GasMix.air.fO2 ? 'AIR' : `EAN${Math.round(this.fO2 * 100)}`;
        }
    }

    public toGas(): Gas {
        return new Gas(this.fO2, this.fHe);
    }
}

/**
 * Real gas compression calculator.
 * Based on https://github.com/atdotde/realblender
 * Started as original perl script rewrite to typescript.
 */
export class RealBlender {
    private readonly compress = new Compressibility();

    private format(value: number): string {
        return value.toFixed(1);
    }

    public blend(pi: number, gasi: GasMix, pf: number, gasf: GasMix,
        gas1: GasMix, gas2: GasMix, gas3: GasMix): string {

        if (gasi.fO2) {
            if (gasf.fHe > 0) {
                return this.blendTrimix(pi, pf, gasi, gas1, gas2, gas3, gasf);
            } else {
                return this.blendNitrox(pi, gasi, pf, gasf, gas1, gas3);
            }
        } else {
            return 'Only print the params form.';
        }
    }

    private blendTrimix(pi: number, pf: number, gasi: GasMix, gas1: GasMix, gas2: GasMix, gas3: GasMix, gasf: GasMix): string {
        const det =   gas3.fHe * gas2.fN2 * gas1.fN2
                    - gas2.fHe * gas3.fN2 * gas1.fO2
                    - gas3.fHe * gas1.fN2 * gas2.fO2
                    + gas1.fHe * gas3.fN2 * gas2.fO2
                    + gas2.fHe * gas1.fN2 * gas3.fO2
                    - gas1.fHe * gas2.fN2 * gas3.fO2;

        if (!det) {
            return 'Cannot mix with degenerate gases!\n';
        }

        const ivol = this.compress.normalVolume(pi, gasi.toGas());
        const fvol = this.compress.normalVolume(pf, gasf.toGas());

        const top1 = ((gas3.fN2 * gas2.fO2 - gas2.fN2 * gas3.fO2) * (gasf.fHe * fvol - gasi.fHe * ivol)
        + (gas2.fHe * gas3.fO2 - gas3.fHe * gas2.fO2) * (gasf.fN2 * fvol - gasi.fN2 * ivol)
        + (gas3.fHe * gas2.fN2 - gas2.fHe * gas3.fN2) * (gasf.fO2 * fvol - gasi.fO2 * ivol)) / det;

        const top2 = ((gas1.fN2 * gas3.fO2 - gas3.fN2 * gas1.fO2) * (gasf.fHe * fvol - gasi.fHe * ivol)
        + (gas3.fHe * gas1.fO2 - gas1.fHe * gas3.fO2) * (gasf.fN2 * fvol - gasi.fN2 * ivol)
        + (gas1.fHe * gas3.fN2 - gas3.fHe * gas1.fN2) * (gasf.fO2 * fvol - gasi.fO2 * ivol)) / det;

        const top3 = ((gas2.fN2 * gas1.fO2 - gas1.fN2 * gas2.fO2) * (gasf.fHe * fvol - gasi.fHe * ivol)
        + (gas1.fHe * gas2.fO2 - gas2.fHe * gas1.fO2) * (gasf.fN2 * fvol - gasi.fN2 * ivol)
        + (gas2.fHe * gas1.fN2 - gas1.fHe * gas2.fN2) * (gasf.fO2 * fvol - gasi.fO2 * ivol)) / det;

        if (top1 < 0 || top2 < 0 || top3 < 0) {
            return `Impossible to blend ", ${gasf.name}, " with these gases!\n`;
        }

        const newmix1 = new GasMix(100 * (gasi.fO2 * ivol + gas1.fO2 * top1) / (ivol + top1),
            100 * (gasi.fHe * ivol + gas1.fHe * top1) / (ivol + top1));

        const p1 = this.compress.pressure(newmix1.toGas(), ivol + top1);

        const newmix2 = new GasMix(100 * (gasi.fO2 * ivol + gas1.fO2 * top1 + gas2.fO2 * top2) / (ivol + top1 + top2),
            100 * (gasi.fHe * ivol + gas1.fHe * top1 + gas2.fHe * top2) / (ivol + top1 + top2));

        const p2 = this.compress.pressure(newmix2.toGas(), ivol + top1 + top2);


        return `
Start with ${ this.format(pi)} bar of ${ gasi.name }.
Top up with ${gas1.name} up to ${this.format(p1)} bar and end up with ${newmix1.name}.
Then top up with ${gas2.name} up to ${this.format(p2)} bar and end up with ${newmix2.name}.
Finally, top up with ${gas3.name} up to ${this.format(pf)} bar and end up with ${gasf.name}.
Use ${this.format(top1)} litres of ${gas1.name}
${this.format(top2)} litres of ${gas2.name} and
${this.format(top3)} litres of ${gas3.name} per litre of cylinder volume.`;
    }

    private blendNitrox(pi: number, gasi: GasMix,
        pf: number, gasf: GasMix,
        gas1: GasMix, gas2: GasMix): string  {


        if (gas1.fO2 === gas2.fO2) {
            return 'Cannot mix with identical gases!\n';
        }

        const ivol = this.compress.normalVolume(pi, gasi.toGas());
        const fvol = this.compress.normalVolume(pf, gasf.toGas());

        const top1 = (gas2.fO2 - gasf.fO2) / (gas2.fO2 - gas1.fO2) * fvol
        - (gas2.fO2 - gasi.fO2) / (gas2.fO2 - gas1.fO2) * ivol;
        const top2 = (gas1.fO2 - gasf.fO2) / (gas1.fO2 - gas2.fO2) * fvol
        - (gas1.fO2 - gasi.fO2) / (gas1.fO2 - gas2.fO2) * ivol;

        if (top1 <= 0) {
            return 'Impossible to blend with these gases!\n';
        }

        const newmix = new GasMix(100 * (gasi.fO2 * ivol + gas1.fO2 * top1) / (ivol + top1));

        const p1 = this.compress.pressure(newmix.toGas(), ivol + top1);

        return `
Start with ${this.format(pi)} bar of ${ gasi.name}.
Top up with ${gas1.name} up to ${this.format(p1)} bar and end up with ${newmix.name}.
Finally, top up with ${gas2.name} up to ${this.format(pf)} bar and end up with ${gasf.name}.
Use ${this.format(top1)} litres of ${gas1.name} and ${this.format(top2)} litres of ${gas2.name} per litre of cylinder volume.`;
    }
}
