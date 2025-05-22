import { topics } from './quiz.questions';
import { Topic, Category, QuestionTemplate} from './learn.models';
import { QuizItem } from "./quiz-item.model";

describe('Quiz questions definition', () => {
    it('All topics have at least one category with one question', () => {
        const wrongCategories = topics
            .flatMap((t: Topic) => t.categories.map(c => ({
                    topic: t.name,
                    category: c.name,
                    questions: c.questions.length
                })))
            .filter(s => s.questions <= 0);

        expect(wrongCategories.length)
            .withContext(`There are categories without questions: ${ JSON.stringify(wrongCategories) }`)
            .toBe(0);
    });

    it('Category names should be unique across all topics', () => {
        const allNames = topics
            .flatMap((t: Topic) => t.categories)
            .map((c: Category) => c.name);

        const uniqueNames = new Set(allNames);

        expect(uniqueNames.size).toBe(allNames.length);
    });

    it('All question should have all parameter names used in question text', () => {
        const placeholderRe = /\{(\w+)\}/g;

        topics.forEach((topic: Topic) => {
            topic.categories.forEach((category: Category) => {
                category.questions.forEach((q: QuestionTemplate) => {
                    const placeholders = new Set<string>();
                    let matchResult: RegExpExecArray | null;
                    while ((matchResult = placeholderRe.exec(q.question)) !== null) {
                        placeholders.add(matchResult[1]);
                    }

                    const varNames = new Set(q.variables.map(v => v.name));

                    expect(placeholders).toEqual(varNames);
                });
            });
        });
    });

    it('Is able to generate valid variable sets and answer', () => {
        topics.forEach(topic => {
            topic.categories.forEach(category => {
                category.questions.forEach(template => {
                    for (let iteration = 0; iteration < 1000; iteration++) {
                        const question = new QuizItem(template);

                        question.variables.forEach(v => expect(Number.isFinite(v))
                            .withContext(`Generated invalid variables for: '${template.question}' with variables [${question.variables}].`)
                            .toBeTruthy());
                        expect(Number.isFinite(question.correctAnswer))
                            .withContext(`Generated invalid answer for: '${template.question}' with variables [${question.variables}].`)
                            .toBeTruthy();
                    }
                });
            });
        });
    });
});
