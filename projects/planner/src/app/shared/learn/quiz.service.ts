import { Inject, Injectable, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Category, Topic } from './learn.models';
import { QuizSession } from './quiz.session';
import { topics } from './quiz.questions';
import { QuizSessionDto } from '../serialization.model';
import { Question } from './quiz.question';

/**
 * Topic/Category names used to be plain English display text and doubled as the persistence
 * key for saved quiz progress and last-viewed state. They were switched to translation keys
 * (see quiz.questions.ts) so the names can be localized; this maps the old English values to
 * the new keys so progress/state saved before that change still restores correctly.
 */
const legacyTopicNames: Record<string, string> = {
    'Pressure at depth': 'learn.topics.pressureAtDepth',
    'Nitrox': 'learn.topics.nitrox',
    'Consumption': 'learn.topics.consumption',
    'Trimix': 'learn.topics.trimix'
};

const legacyCategoryNames: Record<string, string> = {
    'Depth': 'learn.categories.examples_depth',
    'Pressure': 'learn.categories.examples_pressure',
    'Maximum operational depth': 'learn.categories.examples_mod',
    'Best mix': 'learn.categories.examples_bestmix',
    'Oxygen partial pressure': 'learn.categories.examples_ppO2',
    'Equivalent air depth': 'learn.categories.examples_ead',
    'Surface air consumption': 'learn.categories.examples_sac',
    'Respiratory minute volume': 'learn.categories.examples_rmv',
    'Used gas': 'learn.categories.examples_consumed',
    'Dive duration': 'learn.categories.examples_durationbyrmv',
    'Minimum depth': 'learn.categories.examples_mindepth',
    'Equivalent narcotic depth': 'learn.categories.examples_end',
    'Maximum narcotic depth': 'learn.categories.examples_mnd'
};

export interface TopicStatus {
   finished: number;
   total: number;
   hasTrophy: boolean
}

export interface CategoryStatus {
   score: number;
   showScore: boolean;
   finished: boolean;
   attempts:number;
   required: number;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    public readonly topics: Topic[];
    private _selectedTopic: Topic;
    private _selectedCategory: Category;
    private _session: QuizSession;
    private _question!: Question;
    private sessionsByCategory = new Map<string, QuizSession>();

    constructor(
        @Optional() @Inject(topics) tops?: Topic[],
        @Optional() private translate?: TranslateService) {
        this.topics = tops || topics;
        this._selectedTopic = this.topics[0];
        this._selectedCategory = this.selectedTopic.categories[0];
        this._session = this.resolveSession(this.selectedCategory);
        this.goToNextQuestion();
    }

    public get selectedTopic(): Topic {
        return this._selectedTopic;
    }

    public get selectedCategory(): Category {
        return this._selectedCategory;
    }

    public get session(): QuizSession {
        return this._session;
    }

    public get question(): Question {
        return this._question;
    }

    public selectByName(topic: string, category: string): void {
        const topicName = legacyTopicNames[topic] || topic;
        const categoryName = legacyCategoryNames[category] || category;
        const foundTopic = this.topics.find(t => t.name === topicName);
        const loadedTopic = foundTopic || this.topics[0];
        const foundCategory = loadedTopic.categories.find(c => c.name === categoryName);
        const loadedCategory = foundCategory || loadedTopic.categories[0];
        this.select(loadedTopic, loadedCategory);
    }

    public select(topic: Topic, category: Category): void {
        this._selectedTopic = topic || this.topics[0];
        this._selectedCategory = category || this.selectedTopic.categories[0];
        this._session = this.resolveSession(this.selectedCategory);
        this.goToNextQuestion();
    }

    public goToNextQuestion(): void {
        this._question = this.selectedCategory.createQuestion(key => this.translateQuestion(key));
        this.session.resetHinted();
    }

    public validateCurrentAnswer(): void {
        this.question.validateAnswer();

        if (this.question.isCorrect) {
            this.session.answerCorrectly();
        } else {
            this.session.answerWrong();
        }
    }

    public loadFrom(loaded: QuizSessionDto[]): void {
        this.sessionsByCategory.clear();
        this.restoreSessions(loaded);
    }

    public topicStatus(topic: Topic): TopicStatus {
        const finished = this.countGainedTrophies(topic);
        const total = topic.categories.length;
        const hasTrophy = finished === total;
        return { finished, total, hasTrophy };
    }

    public categoryStatus(category: Category): CategoryStatus {
        const session = this.sessionsByCategory.get(category.name);
        if (!session) {
            return { score: 0, showScore: false, finished: false, attempts:0,  required: QuizSession.requiredAnsweredCount };
        }
        return {
            score: session.correctPercentage,
            showScore: session.totalAnswered > QuizSession.requiredAnsweredCount,
            finished: session.trophyGained,
            attempts: session.totalAnswered,
            required: QuizSession.requiredAnsweredCount,
        };
    }

    public serializeSessions(): QuizSessionDto[] {
        const entries: QuizSessionDto[] = [];

        for (const [, session] of this.sessionsByCategory.entries()) {
            const sessionDto = session.toDto();
            entries.push(sessionDto);
        }

        return entries;
    }

    private resolveSession(category: Category): QuizSession {
        const existing = this.sessionsByCategory.get(category.name);
        if (existing) {
            return existing;
        }

        const session = new QuizSession(category);
        this.sessionsByCategory.set(category.name, session);
        return session;
    }

    private countGainedTrophies(topic: Topic): number {
        let count = 0;
        for (const category of topic.categories) {
            const key = category.name;
            if (this.sessionsByCategory.get(key)?.trophyGained) {
                count++;
            }
        }
        return count;
    }

    private translateQuestion(key: string): string {
        return this.translate ? this.translate.instant(key) : key;
    }

    private restoreSessions(entries: QuizSessionDto[] | undefined): void {
        if (!entries) {
            return;
        }

        for (const entry of entries) {
            const categoryName = legacyCategoryNames[entry.category] || entry.category;
            const category = this.topics
                .flatMap(topic => topic.categories)
                .find(c => c.name === categoryName);

            if (!category) {
                continue;
            }

            const session = QuizSession.fromDto(entry, category);
            this.sessionsByCategory.set(category.name, session);
        }
    }
}
