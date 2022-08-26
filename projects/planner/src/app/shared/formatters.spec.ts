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
});
