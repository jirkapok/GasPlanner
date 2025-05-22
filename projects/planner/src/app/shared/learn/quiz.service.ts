import { Injectable } from '@angular/core';
import { Category, Topic } from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { QuizSessionDto } from '../serialization.model';

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
    public topics: Topic[] = topics;
    private sessionsByCategory = new Map<string, QuizSession>();

    constructor() {}

    public loadFrom(loaded: QuizSessionDto[]): void {
        this.sessionsByCategory.clear();
        this.restoreSessions(loaded);
    }

    public countGainedTrophies(topic: Topic): number {
        let count = 0;
        for (const category of topic.categories) {
            const key = category.name;
            if (this.sessionsByCategory.get(key)?.trophyGained) {
                count++;
            }
        }
        return count;
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

    public session(category: Category): QuizSession {
        const existing = this.sessionsByCategory.get(category.name);
        if (existing) {
            return existing;
        }

        const session = new QuizSession([category.getQuizItemForCategory()], category);
        this.sessionsByCategory.set(category.name, session);
        return session;
    }

    public serializeSessions(): QuizSessionDto[] {
        const entries: QuizSessionDto[] = [];

        for (const [, session] of this.sessionsByCategory.entries()) {
            const sessionDto = session.toDto();
            entries.push(sessionDto);
        }

        return entries;
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
