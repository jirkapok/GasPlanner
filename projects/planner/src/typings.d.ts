/* SystemJS module definition */
declare var module: NodeModule;

interface NodeModule {
    id: string;
}

declare module 'canvas-confetti' {
    interface ConfettiOptions {
        particleCount?: number;
        angle?: number;
        spread?: number;
        origin?: { x?: number; y?: number };
        colors?: string[];
        disableForReducedMotion?: boolean;
    }

    export default function confetti(options?: ConfettiOptions): void;
}
