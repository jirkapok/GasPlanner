import { QuizItem } from './quiz.service';

export class QuizSession {
    public static readonly minimalAcceptableSuccessRate = 80;
    public static readonly requiredAnsweredCount = 5;

    public quizzes: QuizItem[] = [];
    public correctCount = 0;
    public totalAnswered = 0;
    public currentQuestionIndex = 0;
    public finished = false;
    public hintUsed = false;
    public totalScore = 0;

    private readonly pointsCorrect = 2;
    private readonly pointsHinted = 1;

    constructor(quizzes: QuizItem[]) {
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
            this.totalScore += this.hintUsed ? this.pointsHinted : this.pointsCorrect;
        }

        this.hintUsed = false;
    }

    public useHint(): void {
        this.hintUsed = true;
    }

    public generateNewQuizzes(): void {
        this.finished = false;
        this.currentQuestionIndex = 0;

        this.quizzes.forEach(q => {
            q.randomizeQuizVariables();
            q.renderQuestion();
            q.isAnswered = false;
            q.isCorrect = false;
            q.userAnswer = '';
        });
    }

    public goToNextQuestion(): void {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.quizzes.length) {
            if (this.canFinishSession()) {
                this.finished = true;
            } else {
                this.generateNewQuizzes();
            }
        }
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
        return this.totalAnswered >= QuizSession.requiredAnsweredCount
        && this.correctPercentage >= QuizSession.minimalAcceptableSuccessRate;
    }

    public finishIfEligible(): void {
        if (this.canFinishSession()) {
            this.finished = true;
        } else {
            this.generateNewQuizzes();
        }
    }
}
