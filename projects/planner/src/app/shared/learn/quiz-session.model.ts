import { Category } from './learn.models';
import { QuizSessionDto } from '../serialization.model';
import { QuizItem } from './quiz-item.model';

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
    public trophyGained = false;

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

    public get correctPercentage(): number {
        return this.maxPoints === 0 ? 0 : Math.round((this.totalScore / this.maxPoints) * 100);
    }

    public get maxPoints(): number {
        return this.totalAnswered * QuizSession.pointsCorrect;
    }

    public get anyHintsUsed(): boolean {
        return (this.maxPoints !== this.totalScore) && ((this.totalScore / QuizSession.pointsCorrect) < this.totalAnswered);
    }

    public get scoreSummary(): string {
        return `${this.totalScore} points (${this.correctCount}/${this.totalAnswered} correct)`;
    }

    public static fromDto(dto: QuizSessionDto, sourceCategory: Category): QuizSession {
        const session = new QuizSession([sourceCategory.getQuizItemForCategory()], sourceCategory);
        session.correctCount = dto.correctCount;
        session.totalAnswered = dto.totalAnswered;
        session.currentQuestionIndex = dto.currentQuestionIndex;
        session.finished = dto.finished;
        session.hintUsed = dto.hintUsed;
        session.totalScore = dto.totalScore;
        session.trophyGained = dto.trophyGained;
        return session;
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

    public canFinishSession(): boolean {
        const maxPossibleScore = this.totalAnswered * QuizSession.pointsCorrect;
        const scorePercentage = maxPossibleScore === 0 ? 0 : (this.totalScore / maxPossibleScore) * 100;
        return this.totalAnswered >= QuizSession.requiredAnsweredCount &&
               scorePercentage >= QuizSession.minimalAcceptableSuccessRate;
    }

    public finishIfEligible(): boolean {
        if (this.canFinishSession()) {
            this.finished = true;
            this.trophyGained = true;
            return true;
        }
        return false;
    }

    public toDto(): QuizSessionDto {
        return {
            category: this.sourceCategory.name,
            correctCount: this.correctCount,
            totalAnswered: this.totalAnswered,
            currentQuestionIndex: this.currentQuestionIndex,
            finished: this.finished,
            hintUsed: this.hintUsed,
            totalScore: this.totalScore,
            trophyGained: this.trophyGained
        };
    }
}

