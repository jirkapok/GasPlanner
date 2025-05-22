import { Injectable, Optional } from '@angular/core';
import { Category, Topic } from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { QuizSessionDto } from '../serialization.model';
import { QuizItem } from "./quiz-item.model";

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
    public _question!: QuizItem;
    private sessionsByCategory = new Map<string, QuizSession>();

    constructor(@Optional()  tops?: Topic[]) {
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

    public get question(): QuizItem {
        return this._question;
    }

    public selectByName(topic: string, category: string): void {
        const foundTopic = this.topics.find(t => t.name === topic);
        const loadedTopic = foundTopic || this.topics[0];
        const foundCategory = loadedTopic.categories.find(c => c.name === category);
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
        this._question = this.selectedCategory.createQuestion();
        this.session.resetHinted();
    }

    public validateCurrentAnswer(): void {
        const quiz = this.question;

        // TODO move to question
        quiz.isCorrect = quiz.validateAnswer();
        quiz.isAnswered = true;

        if (quiz.isCorrect) {
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

    private restoreSessions(entries: QuizSessionDto[] | undefined): void {
        if (!entries) {
            return;
        }

        for (const entry of entries) {
            const category = this.topics
                .flatMap(topic => topic.categories)
                .find(c => c.name === entry.category);

            if (!category) {
                continue;
            }

            const session = QuizSession.fromDto(entry, category);
            this.sessionsByCategory.set(entry.category, session);
        }
    }
}
