import { Injectable } from '@angular/core';
import { Topic} from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { AppPreferences, QuizSessionDtoEntry } from '../serialization.model';
import { HelpModalComponent } from '../../help-modal/help-modal.component';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    public topics: Topic[] = topics;
    public sessionsByCategory = new Map<string, QuizSession>();
    public quizWelcomeWasShown = false;

    constructor(
        private modalService: MdbModalService
    ) {}

    public applyApp(loaded: AppPreferences): void {

        console.log('applyApp', loaded);
        this.sessionsByCategory.clear();
        this.restoreSessions(loaded.quizSessions);

        this.quizWelcomeWasShown = loaded.quizWelcomeWasShown;

        console.log('applyApp', this.quizWelcomeWasShown);

        if (!this.quizWelcomeWasShown) {
            this.quizWelcomeWasShown = true;
            this.modalService.open(HelpModalComponent, {
                data: { path: 'learn-welcome' }
            });
        }
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

    public getSerializableSessions(): QuizSessionDtoEntry[] {
        const entries: QuizSessionDtoEntry[] = [];

        for (const [category, session] of this.sessionsByCategory.entries()) {
            entries.push({
                category,
                session: session.toDto()
            });
        }

        return entries;
    }

    public restoreSessions(entries: QuizSessionDtoEntry[] | undefined): void {
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

            const session = QuizSession.fromDto(entry.session, category);
            this.sessionsByCategory.set(entry.category, session);
        }
    }
}
// const isValid = Precision.isInRange(value, min, max);
// kumulativni prumer
// pokusu  = 10 , aktualini prumer 0.7
// prumer = (10 * 0.7 + novaodpoved) / (10 + 1), pokusy + 1
// spatne = 0b, s napovdedou = 1 (0.5), bez napovedy spravne  = 2 (1)
// help pokud spocital spatne
