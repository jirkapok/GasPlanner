import { QuizSession } from "./quiz-session.model";
import { Category, QuestionTemplate, RoundType } from "./learn.models";

describe('Quiz Session', () => {
    const expectedAnswer = 99;
    const questionTemplate = new QuestionTemplate("Question 1", 0, RoundType.round, [], () => expectedAnswer);
    const category = new Category("Category", "category_help", [ questionTemplate ]);

    const assertSessionInInitialState = (sut: QuizSession) => {
        expect(sut.trophyGained).toBeFalsy();
        expect(sut.totalScore).toBe(0);
        expect(sut.correctPercentage).toBe(0);
        expect(sut.maxPoints).toBe(0);
    };

    const createSession = () => {
        return new QuizSession(category);
    };

    it('Has empty default state', () => {
        const sut = createSession();
        assertSessionInInitialState(sut);
    });

    // TODO test maxPoints, shouldCelebrate, correctPercentage

    describe('Partially answered', () => {
        it('Correct answer', () => {
            const sut = createSession();
            sut.answerCorrectly();

            expect(sut.trophyGained).toBeFalsy();
            expect(sut.anyHintUsed).toBeFalsy();
            expect(sut.totalScore).toBe(2);
            expect(sut.correctPercentage).toBe(100);
            expect(sut.maxPoints).toBe(2);
        });

        it('Correct answer with hint', () => {
            const sut = createSession();
            sut.useHint();
            sut.answerCorrectly();

            expect(sut.trophyGained).toBeFalsy();
            expect(sut.totalScore).toBe(1);
            expect(sut.correctPercentage).toBe(50);
            expect(sut.maxPoints).toBe(2);
        });

        it('Incorrect answer', () => {
            const sut = createSession();
            sut.answerWrong();

            expect(sut.trophyGained).toBeFalsy();
            expect(sut.totalScore).toBe(0);
            expect(sut.correctPercentage).toBe(0);
            expect(sut.maxPoints).toBe(2);
        });

        it('Reset clears session statistics to initial', () => {
            const sut = createSession();
            sut.answerCorrectly();
            sut.useHint();
            sut.answerCorrectly();

            sut.reset();

            assertSessionInInitialState(sut);
        });
    });

    describe('Fully answered', () => {
        const createFinishedSession = () => {
            const sut = createSession();

            for (let question = 0; question < 5; question++) {
                sut.answerCorrectly();
            }

            return sut;
        }

        it('Marks as finished', () => {
            const sut = createFinishedSession();

            expect(sut.trophyGained).toBeTruthy();
            expect(sut.totalScore).toBe(10);
            expect(sut.correctPercentage).toBe(100);
            expect(sut.maxPoints).toBe(10);
        });

        it('Does not gain trophy when some hint used', () => {
            const sut = createSession();

            for (let question = 0; question < 5; question++) {
                sut.useHint();
                sut.answerCorrectly();
            }

            expect(sut.trophyGained).toBeFalsy();
            expect(sut.totalScore).toBe(5);
            expect(sut.correctPercentage).toBe(50);
            expect(sut.maxPoints).toBe(10);
        });

        it('Reset clears session to initial and preserves trophy', () => {
            const sut = createSession();

            for (let question = 0; question < 5; question++) {
                sut.answerCorrectly();
            }

            sut.reset();

            assertSessionInInitialState(sut);
        });
    });
});
