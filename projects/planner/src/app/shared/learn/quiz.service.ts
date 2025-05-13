import { Injectable } from '@angular/core';
import { Topic} from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { AppPreferences, QuizSessionDto } from '../serialization.model';

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    public topics: Topic[] = topics;
    public sessionsByCategory = new Map<string, QuizSession>();

    constructor() {}

    public applyApp(loaded: AppPreferences): void {
        console.log('applyApp', loaded);
        this.sessionsByCategory.clear();
        this.restoreSessions(loaded.quizSessions);
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

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        const finished = this.countGainedTrophies(topic);
        const total = topic.categories.length;
        const color = finished === total ? 'bg-success' : 'bg-warning';
        return { finished, total, color };
    }

    public getSerializableSessions(): QuizSessionDto[] {
        const entries: QuizSessionDto[] = [];

        for (const [category, session] of this.sessionsByCategory.entries()) {
            var sessionDto = session.toDto();
            entries.push(sessionDto);
        }

        return entries;
    }

    public restoreSessions(entries: QuizSessionDto[] | undefined): void {
        if (!Array.isArray(entries)) {
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
