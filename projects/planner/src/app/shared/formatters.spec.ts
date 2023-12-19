import { DateFormats } from './formaters';

describe('Date formatters', () => {
    describe('Chart', () => {
        it('Shows only minutes for 3000 seconds', () => {
            const result = DateFormats.selectChartTimeFormat(300);
            expect(result).toEqual('%M:%S');
        });

        it('Shows also hours for 3600 seconds', () => {
            const result = DateFormats.selectChartTimeFormat(3600);
            expect(result).toEqual('%H:%M:%S');
        });
    });

    describe('Table', () => {
        it('Shows only minutes as one number for 3000 seconds', () => {
            const result = DateFormats.selectTimeFormat(300);
            expect(result).toEqual('m:ss');
        });

        it('Shows also hours as one number for 3600 seconds', () => {
            const result = DateFormats.selectTimeFormat(3600);
            expect(result).toEqual('mm:ss');
        });
    });

    describe('Short time', () => {
        describe('From seconds', () => {
            it('Rounds to minutes', () => {
                const result = DateFormats.formatShortTime(3794);
                expect(result).toEqual('01:03');
            });

            it('Pads minutes', () => {
                const result = DateFormats.formatShortTime(7200);
                expect(result).toEqual('02:00');
            });

            it('Pads hours', () => {
                const result = DateFormats.formatShortTime(0);
                expect(result).toEqual('00:00');
            });
        });

        describe('To seconds', () => {
            it('Parses exact value', () => {
                const result = DateFormats.parseToShortTime('23:53');
                expect(result).toBe(85980);
            });

            it('Parse empty returns 0', () => {
                const result = DateFormats.parseToShortTime('00:00');
                expect(result).toBe(0);
            });

            it('Parse invalid returns null', () => {
                const result = DateFormats.parseToShortTime('7');
                expect(result).toBeNull();
            });

            it('Parse invalid with text returns null', () => {
                const result = DateFormats.parseToShortTime('a:12');
                expect(result).toBeNull();
            });

            it('Parse null returns null', () => {
                const result = DateFormats.parseToShortTime(null);
                expect(result).toBeNull();
            });
        });
    });
});
