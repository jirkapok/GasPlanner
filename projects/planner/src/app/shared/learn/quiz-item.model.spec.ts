import { QuizItem } from "./quiz-item.model";
import { topics } from "./quiz.questions";

describe('Question definition', () => {
    it('Is able to generate valid variable sets and answer', () => {
        topics.forEach(topic => {
            topic.categories.forEach(category => {
                category.questions.forEach(template => {
                    const question = new QuizItem(template);

                    for (let iteration = 0; iteration < 1000; iteration++) {
                        question.randomizeQuizVariables();
                        const answer = question.generateCorrectAnswer();

                        question.variables.forEach(v => expect(Number.isFinite(v))
                            .withContext(`Generated invalid variables for: '${template.question}' with variables [${question.variables}].`)
                            .toBeTruthy());
                        expect(Number.isFinite(answer))
                            .withContext(`Generated invalid answer for: '${template.question}' with variables [${question.variables}].`)
                            .toBeTruthy();
                    }
                });
            });
        });
    });
});
