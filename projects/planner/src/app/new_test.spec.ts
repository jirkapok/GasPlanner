/* eslint-disable jasmine/no-focused-tests */
describe('First Jasmine test', () => {
    fit('Should correctly add two numbers', () => {
        console.log('Running Should Correctly add two numbers');
        const result = 1 + 2;
        expect(result).toBe(3);
    });
});
