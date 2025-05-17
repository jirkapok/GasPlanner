import { topics } from './quiz.questions';
import { Topic, Category, QuestionTemplate} from './learn.models';

describe('Quiz questions basic setup', () => {

    it('category names should be unique across all topics', () => {
        const allNames = topics
            .flatMap((t: Topic) => t.categories)
            .map((c: Category) => c.name);

        const uniqueNames = new Set(allNames);

        expect(uniqueNames.size).toBe(allNames.length);
    });

    it('all question should have all parameter names used in question text', () => {
        const placeholderRe = /\{(\w+)\}/g;

        topics.forEach((topic: Topic) => {
            topic.categories.forEach((category: Category) => {
                category.questions.forEach((q: QuestionTemplate) => {
                    const placeholders = new Set<string>();
                    let m: RegExpExecArray | null;
                    while ((m = placeholderRe.exec(q.question)) !== null) {
                        placeholders.add(m[1]);
                    }

                    const varNames = new Set(q.variables.map(v => v.name));

                    expect(placeholders).toEqual(varNames);
                });
            });
        });
    });
});
