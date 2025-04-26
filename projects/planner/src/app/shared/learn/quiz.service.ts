import { Injectable } from '@angular/core';
import { NitroxCalculator, SacCalculator, DepthConverter, Precision } from 'scuba-physics';
import { Topic, Category, QuestionTemplate, topics, Variable, RoundType } from './learn.models';

export interface QuizItem {
    readonly categoryName: string;
    renderedQuestion: string;
    readonly roundTo: number;
    readonly roundType: RoundType;
    readonly variables: number[];
    userAnswer?: string;
    isAnswered: boolean;
    isCorrect: boolean;
}

@Injectable({
    providedIn: 'root'
})

export class QuizService {
    public topics: Topic[] = topics;

    private nitroxCalculator: NitroxCalculator;
    private sacCalculator: SacCalculator;

    constructor() {
        const depthConverter = DepthConverter.simple();
        this.nitroxCalculator = new NitroxCalculator(depthConverter, 0.21);
        this.sacCalculator = new SacCalculator(depthConverter);
    }

    public getQuizItemForCategory(category: Category): QuizItem {

        const randomIndex = Math.floor(Math.random() * category.questions.length);
        const selectedQuestion = category.questions[randomIndex];

        const quizItem: QuizItem = {
            categoryName: category.name,
            renderedQuestion: selectedQuestion.question,
            roundTo: selectedQuestion.roundTo,
            roundType: selectedQuestion.roundType,
            variables: [],
            userAnswer: undefined,
            isAnswered: false,
            isCorrect: false
        };
        this.randomizeQuizVariables(selectedQuestion, quizItem);
        this.renderQuestion(selectedQuestion, quizItem);

        return quizItem;
    }

    public validateAnswer(quizItem: QuizItem): boolean {
        const userAns = (quizItem.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (isNaN(userNum)) {
            return false;
        }

        const expectedAnswer = this.roundValue(this.generateCorrectAnswer(quizItem), quizItem.roundTo, quizItem.roundType);

        const userAnswerRounded = this.roundValue(userNum, quizItem.roundTo, quizItem.roundType);

        console.log(`User Answer: ${userAnswerRounded}, Expected Answer: ${expectedAnswer}`);

        return userAnswerRounded === expectedAnswer;
    }

    public generateCorrectAnswer(quizItem: QuizItem): number {

        if (quizItem.categoryName.toLowerCase().includes('maximum operational depth')) {
            console.log('PPO2: ', quizItem.variables[0], 'O2%: ', quizItem.variables[1]);
            return this.nitroxCalculator.mod(quizItem.variables[0], quizItem.variables[1]);
        }

        if (quizItem.categoryName.toLowerCase().includes('best mix')) {
            return this.nitroxCalculator.bestMix(quizItem.variables[0], quizItem.variables[1]);
        }

        if (quizItem.categoryName.toLowerCase().includes('partial pressure')) {
            return this.nitroxCalculator.partialPressure(quizItem.variables[0], quizItem.variables[1]);
        }

        if (quizItem.categoryName.toLowerCase().includes('respiratory minute volume')) {
            return this.sacCalculator.calculateSac(
                quizItem.variables[0],
                quizItem.variables[1],
                quizItem.variables[2],
                quizItem.variables[3]
            );
        }

        return NaN; // Make it clear that the question type was not recognized
    }


    public randomizeVariable(variable: Variable): number {
        if (typeof variable.min === 'number' && typeof variable.max === 'number') {
            const min = variable.min;
            const max = variable.max;
            const decimals = Math.max(
                (min.toString().split('.')[1]?.length || 0),
                (max.toString().split('.')[1]?.length || 0)
            );

            const randomValue = Math.random() * (max - min) + min;
            return parseFloat(randomValue.toFixed(decimals));
        } else if (Array.isArray(variable.options)) {
            const randomIndex = Math.floor(Math.random() * variable.options.length);
            return variable.options[randomIndex];
        }
        return 1; // Default value if no options or range is provided
    }

    public randomizeQuizVariables(questionTemplate: QuestionTemplate, quizItem: QuizItem): void {
        let indexSafe = 0;
        do{
            questionTemplate.variables.forEach(variable => {

                quizItem.variables.push(this.randomizeVariable(variable));

            });
        }   while(!Number.isNaN(this.generateCorrectAnswer(quizItem)) && indexSafe++ < 100);
    }

    public renderQuestion(questionTemplate: QuestionTemplate, quizItem: QuizItem): void {
        let rendered = questionTemplate.question;
        if (Array.isArray(questionTemplate.variables)) {
            questionTemplate.variables.forEach((variable, index) => {
                rendered = rendered.replace(new RegExp(`{${variable.name}}`, 'g'), quizItem.variables[index].toString());
            });
        }
        quizItem.renderedQuestion = rendered;
    }

    public roundValue(value: number, roundTo: number, roundType: RoundType): number {
        switch (roundType) {
            case RoundType.floor:
                return Precision.floor(value, roundTo);
            case RoundType.ceil:
                return Precision.ceil(value, roundTo);
            case RoundType.round:
            default:
                return Precision.round(value, roundTo);
        }
    }
}

// const isValid = Precision.isInRange(value, min, max);
// kumulativni prumer
// pokusu  = 10 , aktualini prumer 0.7
// prumer = (10 * 0.7 + novaodpoved) / (10 + 1), pokusy + 1
// spatne = 0b, s napovdedou = 1 (0.5), bez napovedy spravne  = 2 (1)
// help pokud spocital spatne
