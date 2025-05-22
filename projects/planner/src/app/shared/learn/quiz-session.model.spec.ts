import { QuizSession } from "./quiz-session.model";
import { Category, QuestionTemplate, RoundType } from "./learn.models";
import { QuizItem } from "./quiz-item.model";

describe('Quiz Session', () => {
    const expectedAnswer = 99;
    const questionTemplate = new QuestionTemplate("Question 1", 0, RoundType.round, [], () => expectedAnswer);
    const category = new Category("Category", "category_help", [ questionTemplate ]);
    const quizItem = category.createQuestion();

    const assertSessionInInitialState = (sut: QuizSession) => {
        expect(sut.canFinishSession()).toBeFalsy();
        expect(sut.finished).toBeFalsy();
        expect(sut.totalScore).toBe(0);
        expect(sut.correctPercentage).toBe(0);
        expect(sut.maxPoints).toBe(0);
    };

    const createSession = (items: QuizItem[]) => {
        return new QuizSession(items, category);
    };

    const createSessionWithItem = () => {
        return createSession([quizItem]);
    };

    describe('Default state', () => {
        xit('No quiz item creates default one', () => {
            const sut = createSession([]);
            expect(sut.currentQuiz).not.toBeNull();
        });

        it('Sets current quiz at startup', () => {
            const sut = createSessionWithItem();
            expect(sut.currentQuiz).toBe(quizItem);
        });

        it('Has empty default score', () => {
            const sut = createSessionWithItem();
            assertSessionInInitialState(sut);
        });
    });

    describe('Partially answered', () => {
        it('Correct answer', () => {
            const sut = createSessionWithItem();
            sut.currentQuiz.userAnswer = expectedAnswer.toString();
            sut.validateCurrentAnswer();

            expect(sut.canFinishSession()).toBeFalsy();
            expect(sut.finished).toBeFalsy();
            expect(sut.totalScore).toBe(2);
            expect(sut.correctPercentage).toBe(100);
            expect(sut.maxPoints).toBe(2);
        });

        it('Correct answer with hint', () => {
            const sut = createSessionWithItem();
            sut.currentQuiz.userAnswer = expectedAnswer.toString();
            sut.useHint();
            sut.validateCurrentAnswer();

            expect(sut.canFinishSession()).toBeFalsy();
            expect(sut.finished).toBeFalsy();
            expect(sut.totalScore).toBe(1);
            expect(sut.correctPercentage).toBe(50);
            expect(sut.maxPoints).toBe(2);
        });

        it('Incorrect answer', () => {
            const sut = createSessionWithItem();
            sut.currentQuiz.userAnswer = '77';
            sut.validateCurrentAnswer();

            expect(sut.canFinishSession()).toBeFalsy();
            expect(sut.finished).toBeFalsy();
            expect(sut.totalScore).toBe(0);
            expect(sut.correctPercentage).toBe(0);
            expect(sut.maxPoints).toBe(2);
        });

        it('Cant finish session', () => {
            const sut = createSessionWithItem();
            const finished = sut.finishIfEligible();

            expect(finished).toBeFalsy();
            expect(sut.finished).toBeFalsy();
        });

        it('Reset clears session statistics to initial', () => {
            const sut = createSessionWithItem();
            sut.currentQuiz.userAnswer = expectedAnswer.toString();
            sut.validateCurrentAnswer();

            sut.reset();

            assertSessionInInitialState(sut);
        });
    });

    describe('Fully answered', () => {
        it('Marks as finished', () => {
            const sut = createSessionWithItem();

            for (let question = 0; question < 5; question++) {
                sut.currentQuiz.userAnswer = expectedAnswer.toString();
                sut.validateCurrentAnswer();
            }

            expect(sut.canFinishSession()).toBeTruthy();
            expect(sut.finishIfEligible()).toBeTruthy();
            expect(sut.finished).toBeTruthy();
            expect(sut.totalScore).toBe(10);
            expect(sut.correctPercentage).toBe(100);
            expect(sut.maxPoints).toBe(10);
        });

        xit('Reset clears session to initial and preserves trophy', () => {
            const sut = createSessionWithItem();

            for (let question = 0; question < 5; question++) {
                sut.currentQuiz.userAnswer = expectedAnswer.toString();
                sut.validateCurrentAnswer();
            }

            sut.finishIfEligible();
            sut.reset();

            assertSessionInInitialState(sut);
            expect(sut.trophyGained).toBeTruthy();
        });
    });
});
