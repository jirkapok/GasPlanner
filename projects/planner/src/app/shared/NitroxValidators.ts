import {
    ValidationErrors, ValidatorFn
} from '@angular/forms';

export class NitroxValidators {
    public static lowMod(failingMod: () => boolean): ValidatorFn {
        return (): ValidationErrors | null => {
            if (failingMod()) {
                return {
                    lowMod: true
                };
            }

            return null;
        };
    }
}
