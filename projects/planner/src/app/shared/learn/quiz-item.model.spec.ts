import { QuizItem } from "./quiz-item.model";
import { QuestionTemplate, RoundType, NumberVariable } from "./learn.models";

describe('Quiz Question', () => {
    it('Renders variables into question template', () => {
        const questionTemplate = new QuestionTemplate("Question: with {cccc} and {bbbb} and {aaaa}.",
            1,
            RoundType.ceil,
            [
                new NumberVariable('aaaa', undefined, 1, 1),
                new NumberVariable('bbbb', undefined, 2, 2),
                new NumberVariable('cccc', undefined, 3, 3),
            ],
            () => 0);

        const question = new QuizItem(questionTemplate);
        question.renderQuestion();

        expect(question.renderedQuestion).toEqual("Question: with 3 and 2 and 1.");
    });

    const createQuestionWithRounding = (roundType: RoundType) => {
        const template = new QuestionTemplate("Question: with {aaaa}.",
            1,
            roundType,
            [],
            (_) => 1.25);
        const question = new QuizItem(template);
        question.userAnswer = "1";
        return question;
    };

    it('Rounds DOWN the question correct answer', () => {
        const question = createQuestionWithRounding(RoundType.floor);
        question.validateAnswer();

        expect(question.correctAnswer).toBeCloseTo(1.2, 1);
    });

    it('Rounds UP the question correct answer', () => {
        const question = createQuestionWithRounding(RoundType.ceil);
        question.validateAnswer();

        expect(question.correctAnswer).toBeCloseTo(1.3, 1);
    });

    xit('Does create correct answer, even user answer was empty', () => {
        const question = createQuestionWithRounding(RoundType.ceil);
        question.userAnswer = '';
        question.validateAnswer();

        expect(question.correctAnswer).toBeCloseTo(1.2, 1);
    });
});
