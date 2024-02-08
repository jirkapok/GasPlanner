import { environment } from '../../environments/environment';

export class Logger {
    public static debug(message: string): void {
        if (!environment.production) {
            console.debug(message);
        }
    }

    public static warn(message: string): void {
        if (!environment.production) {
            console.warn(message);
        }
    }
}
