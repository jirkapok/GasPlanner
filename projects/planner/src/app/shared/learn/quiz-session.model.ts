import { QuizItem } from './quiz.service';
import { Category } from './learn.models';

export class QuizSession {
    public static readonly minimalAcceptableSuccessRate = 80;
    public static readonly requiredAnsweredCount = 5;
    public static readonly pointsCorrect = 2;
    public static readonly pointsHinted = 1;

    public quizzes: QuizItem[] = [];
    public correctCount = 0;
    public totalAnswered = 0;
    public currentQuestionIndex = 0;
    public finished = false;
    public hintUsed = false;
    public totalScore = 0;

    constructor(
        quizzes: QuizItem[],
        private readonly sourceCategory: Category
    ) {
        this.quizzes = quizzes;
    }

    public get currentQuiz(): QuizItem {
        return this.quizzes[this.currentQuestionIndex];
    }

    public get correctPercentage(): number {
        return this.totalAnswered === 0
            ? 0
            : Math.round((this.correctCount / this.totalAnswered) * 100);
    }

    public get scoreSummary(): string {
        return `${this.totalScore} points (${this.correctCount}/${this.totalAnswered} correct)`;
    }

    public validateCurrentAnswer(): void {
        const quiz = this.currentQuiz;
        if (!quiz) {
            return;
        }

        quiz.isCorrect = quiz.validateAnswer();
        quiz.isAnswered = true;
        this.totalAnswered++;

        if (quiz.isCorrect) {
            this.correctCount++;
            this.totalScore += this.hintUsed
                ? QuizSession.pointsHinted
                : QuizSession.pointsCorrect;
        }

        this.hintUsed = false;
    }

    public useHint(): void {
        this.hintUsed = true;
    }

    public goToNextQuestion(): void {
        if (this.currentQuestionIndex < this.quizzes.length - 1) {
            this.currentQuestionIndex++;
        } else {
            this.addNewQuestion();
            this.currentQuestionIndex++;
        }
    }

    public addNewQuestion(): void {
        const newQuiz = this.sourceCategory.getQuizItemForCategory();
        this.quizzes.push(newQuiz);
    }

    public reset(): void {
        this.correctCount = 0;
        this.totalAnswered = 0;
        this.currentQuestionIndex = 0;
        this.finished = false;
        this.totalScore = 0;
        this.hintUsed = false;

        this.quizzes.forEach(q => {
            q.isAnswered = false;
            q.isCorrect = false;
            q.userAnswer = '';
            q.renderedQuestion = '';
        });
    }

    public canFinishSession(): boolean {
        const maxPossibleScore = this.totalAnswered * QuizSession.pointsCorrect;
        const scorePercentage = maxPossibleScore === 0 ? 0 : (this.totalScore / maxPossibleScore) * 100;
        return this.totalAnswered >= QuizSession.requiredAnsweredCount &&
               scorePercentage >= QuizSession.minimalAcceptableSuccessRate;
    }


    public finishIfEligible(): boolean {
        if (this.canFinishSession()) {
            this.finished = true;
            return true;
        }
        return false;
    }

}

