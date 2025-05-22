import { Category } from './learn.models';
import { QuizSessionDto } from '../serialization.model';
import { QuizItem } from './quiz-item.model';

export class QuizSession {
    private static readonly minimalAcceptableSuccessRate = 80;
    public static readonly requiredAnsweredCount = 5;
    private static readonly pointsCorrect = 2;
    private static readonly pointsHinted = 1;

    // TODO remove there is always only one quiz
    public quizzes: QuizItem[] = [];
    public currentQuestionIndex = 0;

    public correctCount = 0;
    public totalAnswered = 0;
    public totalScore = 0;
    public trophyGained = false;
    private _celebrated = false;
    private hintUsed = false;

    constructor(
        quizzes: QuizItem[],
        private readonly sourceCategory: Category
    ) {
        this.quizzes = quizzes;
    }

    public get currentQuiz(): QuizItem {
        if (this.currentQuestionIndex >= this.quizzes.length) {
            if (this.quizzes[this.quizzes.length-1].isAnswered) {
                this.addNewQuestion();
            } else {
                this.currentQuestionIndex = this.quizzes.length - 1;
            }
        }
        return this.quizzes[this.currentQuestionIndex];
    }

    public get canReset(): boolean {
        return this.totalAnswered > 0;
    }

    public get correctPercentage(): number {
        if(this.maxPoints === 0) {
            return 0;
        }

        return Math.round((this.totalScore / this.maxPoints) * 100);
    }

    public get celebrated(): boolean {
        return this._celebrated;
    }

    public get shouldCelebrate(): boolean {
        return this.trophyGained && !this.celebrated;
    }

    public get maxPoints(): number {
        return this.totalAnswered * QuizSession.pointsCorrect;
    }

    public get anyHintsUsed(): boolean {
        return (this.maxPoints !== this.totalScore) && (this.totalAnswered > 0);
    }

    public static fromDto(dto: QuizSessionDto, sourceCategory: Category): QuizSession {
        const session = new QuizSession([sourceCategory.getQuizItemForCategory()], sourceCategory);
        session.correctCount = dto.correctCount;
        session.totalAnswered = dto.totalAnswered;
        session.currentQuestionIndex = dto.currentQuestionIndex;
        session.hintUsed = dto.hintUsed;
        session.totalScore = dto.totalScore;
        session.trophyGained = dto.trophyGained;
        return session;
    }

    public markCelebrated(): void {
        this._celebrated = true;
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
        this.finishIfEligible();
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

    private addNewQuestion(): void {
        const newQuiz = this.sourceCategory.getQuizItemForCategory();
        this.quizzes.push(newQuiz);
    }

    private get canFinishSession(): boolean {
        return this.totalAnswered >= QuizSession.requiredAnsweredCount &&
            this.correctPercentage >= QuizSession.minimalAcceptableSuccessRate;
    }

    private finishIfEligible(): void {
        if (this.canFinishSession) {
            this.trophyGained = true;
        }
    }

    public toDto(): QuizSessionDto {
        return {
            category: this.sourceCategory.name,
            correctCount: this.correctCount,
            totalAnswered: this.totalAnswered,
            currentQuestionIndex: this.currentQuestionIndex,
            hintUsed: this.hintUsed,
            totalScore: this.totalScore,
            trophyGained: this.trophyGained
        };
    }

    public reset(): void {
        this.quizzes = [];
        this.correctCount = 0;
        this.totalAnswered = 0;
        this.currentQuestionIndex = 0;
        this.hintUsed = false;
        this.totalScore = 0;
        this.trophyGained = false;
        this._celebrated = false;
        this.goToNextQuestion();
    }
}

