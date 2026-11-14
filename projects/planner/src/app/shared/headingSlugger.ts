/**
 * Creates heading ids (anchors) the same way as the marked 4 Slugger did,
 * so existing help anchors and shared help links keep working.
 */
export class HeadingSlugger {
    private seen = new Map<string, number>();

    public slug(text: string): string {
        const base = text.toLowerCase().trim()
            .replace(/<[!/a-z].*?>/ig, '')
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
            .replace(/\s/g, '-');

        let result = base;
        let counter = 0;

        if (this.seen.has(base)) {
            counter = this.seen.get(base) ?? 0;
            do {
                counter++;
                result = `${base}-${counter}`;
            } while (this.seen.has(result));
        }

        this.seen.set(base, counter);
        this.seen.set(result, 0);
        return result;
    }

    public reset(): void {
        this.seen.clear();
    }
}
