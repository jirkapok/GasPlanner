export class Precision {
    public static fix(source: number): number {
        // because of javascript numbers precision we need to help our self
        const result = Number(source.toFixed(10));
        return result;
    }
}
