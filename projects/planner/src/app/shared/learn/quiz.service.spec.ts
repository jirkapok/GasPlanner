import { QuizSession } from "./quiz-session.model";
import { Category, QuestionTemplate, RoundType } from "./learn.models";
import { QuizItem } from "./quiz-item.model";
import { QuizService } from "./quiz.service";
import { topics } from "./quiz.questions";

describe('Quiz Service', () => {
    const firstTopic = topics[0];

    const finishCategory = (sut: QuizService, category: Category) => {
        const session = new QuizSession([category.getQuizItemForCategory()], category);
        session.trophyGained = true;
        sut.sessionsByCategory.set(category.name, session);
    };

    describe('Initial state', () => {
        const sut = new QuizService();

        it('Has no trophies', () => {
            const trophies = sut.countGainedTrophies(firstTopic);
            expect(trophies).toBe(0);
        });

        it('Has no completion status', () => {
            const status = sut.topicStatus(firstTopic);
            expect(status.finished).toBe(0);
            expect(status.total).toBe(2);
        });
    });

    describe('Some categories finished', () => {
        const sut = new QuizService();
        const firstCategory = firstTopic.categories[0];
        finishCategory(sut, firstCategory);

        it('Has trophy', () => {
            const trophies = sut.countGainedTrophies(firstTopic);
            expect(trophies).toBe(1);
        });

        it('Has some completion status', () => {
            const status = sut.topicStatus(firstTopic);
            expect(status.finished).toBe(1);
            expect(status.total).toBe(2);
        });
    });

    describe('Topic finished', () => {
        const sut = new QuizService();

        firstTopic.categories.forEach(category => {
            finishCategory(sut, category);
        })

        it('Has trophies', () => {
            const trophies = sut.countGainedTrophies(firstTopic);
            expect(trophies).toBe(2);
        });

        it('Has all completion status', () => {
            const status = sut.topicStatus(firstTopic);
            expect(status.finished).toBe(2);
            expect(status.total).toBe(2);
        });
    });
});
