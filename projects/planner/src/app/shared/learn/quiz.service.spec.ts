import { QuizSession } from "./quiz-session.model";
import { Category, QuestionTemplate, RoundType, Topic } from "./learn.models";
import { QuizService } from "./quiz.service";

describe('Quiz Service', () => {
    let expectedAnswer = 0;

    const topics: Topic[] = [
        new Topic('First topic', [
            new Category('Category 1', '', [
                new QuestionTemplate('Ask me', 1, RoundType.floor,
                    [],
                    () => expectedAnswer),
            ]),
            new Category('Category 1', '', [
                new QuestionTemplate('Ask me', 1, RoundType.floor,
                    [],
                    () => expectedAnswer),
            ])
        ])
    ];

    const firstTopic = topics[0];

    const finishCategory = (sut: QuizService, category: Category) => {
        sut.select(firstTopic, category);

        for (let index = 0; index < QuizSession.requiredAnsweredCount; index++) {
            sut.goToNextQuestion();
            sut.validateCurrentAnswer(expectedAnswer);
        }
    };

    it('Initial state Has no completion status', () => {
        const sut = new QuizService(topics);
        const status = sut.topicStatus(firstTopic);

        expect(status.finished).toBe(0);
        expect(status.hasTrophy).toBeFalsy();
        expect(status.total).toBe(2);
    });

   it('Some categories finished Has some completion status', () => {
        const sut = new QuizService(topics);
        finishCategory(sut, firstTopic.categories[0]);

        const status = sut.topicStatus(firstTopic);
        expect(status.finished).toBe(1);
        expect(status.hasTrophy).toBeFalsy();
        expect(status.total).toBe(2);
    });

    it('Topic finished Has finished completion status', () => {
        const sut = new QuizService(topics);
        finishCategory(sut, firstTopic.categories[0]);
        finishCategory(sut, firstTopic.categories[1]);

        const status = sut.topicStatus(firstTopic);
        expect(status.finished).toBe(2);
        expect(status.hasTrophy).toBeTruthy();
        expect(status.total).toBe(2);
    });
});
