import { QuestionTemplate, RoundType } from './learn.models';
import { QuizItem } from './quiz.service';

export class QuizItemFactory {
    static create(template: QuestionTemplate, categoryName: string): QuizItem {
        const quizItem = new QuizItem(
            template,
            categoryName,
            template.question,
            template.roundTo,
            template.roundType,
            [],
            false,
            false
        );
        quizItem.randomizeQuizVariables();
        quizItem.renderQuestion();
        return quizItem;
    }
}
