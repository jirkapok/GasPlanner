import { BinaryIntervalSearch, SearchContext } from './BinaryIntervalSearch';

describe('Binary interval search', () => {
    const sut = new BinaryIntervalSearch();

    it('Step is larger than bounds throws Error', () => {
        const context: SearchContext = {
            step: 20,
            initialValue: 11,
            maxValue: 30,
            doWork: (newValue: number) => { },
            meetsCondition: () => true
        };

        expect(() => sut.search(context)).toThrow();
    });

    it('MaxValue is smaller then initial value throws error', () => {
        const context: SearchContext = {
            step: 1,
            initialValue: 40,
            maxValue: 30,
            doWork: (newValue: number) => { },
            meetsCondition: () => true
        };

        expect(() => sut.search(context)).toThrow();
    });

    it('When never meets condition, Found value is never lover than initial value', () => {
        const context: SearchContext = {
            step: 1,
            initialValue: 10,
            maxValue: 1000,
            doWork: (newValue: number) => { },
            meetsCondition: () => false
        };

        const found = sut.search(context);
        expect(found).toBe(10);
    });

    it('When always meets condition, than right upper limit is found', () => {
        const context: SearchContext = {
            step: 1,
            initialValue: 0,
            maxValue: 1000,
            doWork: (newValue: number) => { },
            meetsCondition: () => true
        };

        const found = sut.search(context);
        expect(found).toBe(1000);
    });

    describe('Found inside interval', () => {
        it('Excepted value fits step returns minimal value', () => {
            let current = 0;
            const context: SearchContext = {
                step: 10,
                initialValue: 0,
                maxValue: 100,
                doWork: (newValue: number) => {
                    current = newValue;
                },
                meetsCondition: () => current <= 50
            };

            const found = sut.search(context);
            expect(found).toBe(50);
        });

        it('Rounded value is returned', () => {
            let current = 0;
            const context: SearchContext = {
                step: 25,
                initialValue: 0,
                maxValue: 100,
                doWork: (newValue: number) => {
                    current = newValue;
                },
                meetsCondition: () => current <= 60
            };

            const found = sut.search(context);
            expect(found).toBe(60);
        });

        describe('Algorithm performance', () => {
            let current = 0;
            let iterations = 0;

            const context: SearchContext = {
                step: 64,
                initialValue: 0,
                maxValue: 128,
                doWork: (newValue: number) => {
                    current = newValue;
                    iterations++;
                },
                meetsCondition: () => current <= 40
            };

            const found = sut.search(context);

            it('Exact value is returned', () => {
                expect(found).toBe(40);
            });

            it('Only minimum work executions is required', () => {
                expect(iterations).toBe(8);
            });
        });
    });
});
