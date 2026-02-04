import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TutorialStep =
    | "ask_opt_in"        // Ask if user wants to do tutorial
    | "welcome"           // Initial welcome, point to wallet
    | "wallet_connect"    // Waiting for wallet connection
    | "intro_dojo"        // Wallet connected, point to Dojo
    | "practice_setup"    // Character select screen
    | "practice_surge"    // Power Surge card selection
    | "practice_mode"     // Inside PracticeScene
    | "matchmaking_find"  // Back in matchmaking, point to Find Match
    | "fighting"          // Inside FightScene
    | "post_game_tour"    // After fight, tour other pages
    | "completed";        // Tutorial finished

interface TutorialStore {
    // State
    isActive: boolean;
    currentStep: TutorialStep;
    isCompleted: boolean;

    // Actions
    startTutorial: () => void;
    nextStep: () => void;
    setStep: (step: TutorialStep) => void;
    completeTutorial: () => void;
    resetTutorial: () => void;
    skipTutorial: () => void;
}

const STEPS_ORDER: TutorialStep[] = [
    "ask_opt_in",
    "welcome",
    "wallet_connect",
    "intro_dojo",
    'practice_setup',
    'practice_surge',
    'practice_mode',
    'matchmaking_find',
    "fighting",
    "post_game_tour",
    "completed"
];

export const useTutorialStore = create<TutorialStore>()(
    persist(
        (set, get) => ({
            isActive: false,
            currentStep: "ask_opt_in",
            isCompleted: false,

            startTutorial: () => {
                const { isCompleted } = get();
                if (!isCompleted) {
                    set({ isActive: true, currentStep: "ask_opt_in" });
                }
            },

            nextStep: () => {
                const { currentStep } = get();
                const currentIndex = STEPS_ORDER.indexOf(currentStep);

                if (currentIndex < STEPS_ORDER.length - 1) {
                    const nextStep = STEPS_ORDER[currentIndex + 1];
                    set({ currentStep: nextStep });

                    if (nextStep === "completed") {
                        set({ isActive: false, isCompleted: true });
                    }
                } else {
                    set({ isActive: false, isCompleted: true });
                }
            },

            setStep: (step: TutorialStep) => {
                set({ currentStep: step });
                if (step === "completed") {
                    set({ isActive: false, isCompleted: true });
                } else {
                    set({ isActive: true });
                }
            },

            completeTutorial: () => {
                set({ isActive: false, isCompleted: true, currentStep: "completed" });
            },

            resetTutorial: () => {
                set({ isActive: true, isCompleted: false, currentStep: "welcome" });
            },

            skipTutorial: () => {
                set({ isActive: false, isCompleted: true, currentStep: "completed" });
            }
        }),
        {
            name: 'tutorial-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
