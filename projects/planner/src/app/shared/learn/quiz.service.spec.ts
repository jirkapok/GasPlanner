import { QuizSession } from "./quiz.session";
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
            new Category('Category 2', '', [
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
            sut.question.userAnswer = expectedAnswer.toString();
            sut.validateCurrentAnswer();
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

    it('Select selects always some category', () => {
        const sut = new QuizService(topics);
        let selectedTopic!: Topic;
        let selectedCategory!: Category;
        sut.select(selectedTopic, selectedCategory);

        expect(sut.selectedCategory).not.toBeNull();
    });

    it('Select forces new question', () => {
        const sut = new QuizService(topics);
        const oldQuestion = sut.question;
        sut.select(topics[0], topics[0].categories[1])

        expect(sut.question).not.toBe(oldQuestion);
    });

    it('Validate question marks question as answered and adds points to session', () => {
        const sut = new QuizService(topics);
        sut.question.userAnswer = sut.question.correctAnswer.toString();
        sut.validateCurrentAnswer();

        expect(sut.question.isCorrect).toBeTruthy();
        expect(sut.question.isAnswered).toBeTruthy();
        expect(sut.session.totalScore).toBe(2);
    });

    it('Go to next question resets hint', () => {
        const sut = new QuizService(topics);
        const oldQuestion = sut.question;
        sut.session.useHint();
        sut.goToNextQuestion()

        expect(sut.question).not.toBe(oldQuestion);
        expect(sut.session.anyHintUsed).toBeFalsy();
    });
});
