import { Category } from './learn.models';
import { QuizSessionDto } from '../serialization.model';
import { QuizItem } from './quiz-item.model';

export class QuizSession {
    private static readonly minimalAcceptableSuccessRate = 80;
    public static readonly requiredAnsweredCount = 5;
    private static readonly pointsCorrect = 2;
    private static readonly pointsHinted = 1;

    private _correctAnswers = 0;
    private _totalAnswered = 0;
    private _totalScore = 0;
    private _trophyGained = false;
    private _celebrated = false;
    private _hintUsed = false;

    constructor(private readonly sourceCategory: Category) {
    }

    public get correctAnswers(): number {
        return this._correctAnswers;
    }

    public get totalAnswered(): number {
        return this._totalAnswered;
    }

    public get totalScore(): number {
        return this._totalScore;
    }

    public get trophyGained(): boolean {
        return this._trophyGained;
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

    public get anyHintUsed(): boolean {
        return (this.maxPoints !== this.totalScore) && (this.totalAnswered > 0);
    }

    public static fromDto(dto: QuizSessionDto, sourceCategory: Category): QuizSession {
        const session = new QuizSession(sourceCategory);
        session._correctAnswers = dto.correctCount;
        session._totalAnswered = dto.totalAnswered;
        session._totalScore = dto.totalScore;
        session._trophyGained = dto.trophyGained;
        return session;
    }

    public answerCorrectly(): void {
        this._totalAnswered++;
        this._correctAnswers++;
        const points= this._hintUsed ? QuizSession.pointsHinted : QuizSession.pointsCorrect;
        this._totalScore += points;
        this.resetHinted();
        this.finishIfEligible();
    }

    public answerWrong(): void {
        this._totalAnswered++;
        this.resetHinted();
    }

    public markCelebrated(): void {
        this._celebrated = true;
    }

    public useHint(): void {
        this._hintUsed = true;
    }

    private get canFinishSession(): boolean {
        return this.totalAnswered >= QuizSession.requiredAnsweredCount &&
            this.correctPercentage >= QuizSession.minimalAcceptableSuccessRate;
    }

    private finishIfEligible(): void {
        if (this.canFinishSession) {
            this._trophyGained = true;
        }
    }

    public toDto(): QuizSessionDto {
        return {
            category: this.sourceCategory.name,
            correctCount: this.correctAnswers,
            totalAnswered: this.totalAnswered,
            totalScore: this.totalScore,
            trophyGained: this.trophyGained
        };
    }

    public reset(): void {
        this._correctAnswers = 0;
        this._totalAnswered = 0;
        this._totalScore = 0;
        this._trophyGained = false;
        this._celebrated = false;
        this.resetHinted();
    }

    public resetHinted(): void {
        this._hintUsed = false;
    }
}

