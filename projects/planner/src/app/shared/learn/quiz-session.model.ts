import { Category } from './learn.models';
import { QuizSessionDto } from '../serialization.model';
import { QuizItem } from './quiz-item.model';

export class QuizSession {
    private static readonly minimalAcceptableSuccessRate = 80;
    public static readonly requiredAnsweredCount = 5;
    private static readonly pointsCorrect = 2;
    private static readonly pointsHinted = 1;

    public correctCount = 0;
    public totalAnswered = 0;
    public totalScore = 0;
    private _trophyGained = false;
    private _celebrated = false;
    private hintUsed = false;

    constructor(private readonly sourceCategory: Category) {
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

    public get anyHintsUsed(): boolean {
        return (this.maxPoints !== this.totalScore) && (this.totalAnswered > 0);
    }

    public static fromDto(dto: QuizSessionDto, sourceCategory: Category): QuizSession {
        const session = new QuizSession(sourceCategory);
        session.correctCount = dto.correctCount;
        session.totalAnswered = dto.totalAnswered;
        session.hintUsed = dto.hintUsed;
        session.totalScore = dto.totalScore;
        session._trophyGained = dto.trophyGained;
        return session;
    }

    public markCelebrated(): void {
        this._celebrated = true;
    }

    public useHint(): void {
        this.hintUsed = true;
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
            correctCount: this.correctCount,
            totalAnswered: this.totalAnswered,
            hintUsed: this.hintUsed,
            totalScore: this.totalScore,
            trophyGained: this.trophyGained
        };
    }

    public reset(): void {
        this.correctCount = 0;
        this.totalAnswered = 0;
        this.hintUsed = false;
        this.totalScore = 0;
        this._trophyGained = false;
        this._celebrated = false;
        // TODO this.goToNextQuestion();
    }
}

