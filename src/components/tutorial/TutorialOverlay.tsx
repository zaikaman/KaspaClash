import React, { useEffect, useState, useRef } from 'react';
import { useTutorialStore, TutorialStep } from '@/stores/tutorial-store';
import { useWalletStore } from '@/stores/wallet-store';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
const ArrowDown = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
);

const ArrowUp = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

interface TutorialOverlayProps {
    pageContext: 'matchmaking' | 'practice' | 'fight' | 'other';
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ pageContext }) => {
    const { currentStep, isActive, nextStep, setStep, isCompleted, startTutorial, skipTutorial } = useTutorialStore();
    const { connectionState } = useWalletStore();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [dismissedSteps, setDismissedSteps] = useState<Set<string>>(new Set());

    const handleDismissStep = (step: string) => {
        setDismissedSteps(prev => new Set(Array.from(prev).concat(step)));
    };

    // Auto-start check
    useEffect(() => {
        if (!isCompleted && !isActive && pageContext === 'matchmaking') {
            // Small delay to ensure page load
            const timer = setTimeout(() => {
                startTutorial();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, isActive, pageContext, startTutorial]);

    // Wallet connection listener - Auto-advance if connected
    useEffect(() => {
        if (!isActive) return;

        if (connectionState === 'connected') {
            // If we are in the initial steps and wallet is connected, jump to intro_dojo
            if (currentStep === 'welcome' || currentStep === 'wallet_connect') {
                setStep('intro_dojo');
            }
        }

        // Transition to practice_setup if on practice page
        if (pageContext === 'practice' && currentStep === 'intro_dojo') {
            setStep('practice_setup');
        }
    }, [isActive, currentStep, connectionState, setStep, pageContext]);

    // Reset dismissal when step changes
    useEffect(() => {
        // Optional: clear dismissed steps if you want them to reappear if you go back
        // For now, we keep them dismissed or specific logic
    }, [currentStep]);

    // Position update logic - simple and event-driven to avoid layout thrashing
    useEffect(() => {
        if (!isActive) return;

        // If current step is dismissed, do not track position
        if (dismissedSteps.has(currentStep)) {
            setTargetRect(null);
            return;
        }

        let rafId: number;
        let cachedElement: Element | null = null;
        let lastSelector = '';

        const updatePosition = () => {
            let selector = '';

            switch (currentStep) {
                case 'ask_opt_in':
                    // No target, center
                    setTargetRect(null);
                    return;
                case 'welcome':
                case 'wallet_connect':
                    selector = '[data-tutorial="connect-wallet"]';
                    break;
                case 'intro_dojo':
                    selector = '[data-tutorial="enter-practice"]';
                    break;
                case 'practice_setup':
                    selector = '[data-tutorial="start-training"]';
                    break;
                case 'practice_surge':
                    // No specific target, centers content
                    setTargetRect(null);
                    return;
                case 'matchmaking_find':
                    selector = '[data-tutorial="find-match"]';
                    break;
                // case 'post_game_tour':
                // selector = '[data-tutorial="leaderboard-nav"]';
                // break;
                default:
                    setTargetRect(null);
                    return;
            }

            // Cache element lookup
            if (selector !== lastSelector) {
                cachedElement = document.querySelector(selector);
                lastSelector = selector;
            }

            if (cachedElement) {
                const rect = cachedElement.getBoundingClientRect();

                // Add padding
                const padding = 8;
                // Create object directly to avoid DOMRect overhead if unnecessary serialization happens
                const paddedRect = new DOMRect(
                    rect.left - padding,
                    rect.top - padding,
                    rect.width + (padding * 2),
                    rect.height + (padding * 2)
                );

                setTargetRect(paddedRect);
            } else {
                setTargetRect(null);
            }
        };

        // Initial update
        updatePosition();

        // Efficient event listener
        const handleResizeOrScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updatePosition);
        };

        window.addEventListener('resize', handleResizeOrScroll);
        window.addEventListener('scroll', handleResizeOrScroll, true); // Capture phase for sub-scrollers

        return () => {
            window.removeEventListener('resize', handleResizeOrScroll);
            window.removeEventListener('scroll', handleResizeOrScroll, true);
            cancelAnimationFrame(rafId);
        };
    }, [isActive, currentStep]);

    if (!isActive) return null;
    if (dismissedSteps.has(currentStep)) return null;

    // Render different content based on step
    const renderContent = () => {
        switch (currentStep) {
            case 'ask_opt_in':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">New Challenger?</h3>
                        <p className="text-white text-sm leading-relaxed">
                            Would you like to learn how to play KaspaClash?
                        </p>
                        <div className="flex gap-3 mt-2 justify-center">
                            <button
                                className="bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-600 transition-colors text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    skipTutorial();
                                }}
                            >
                                NO, I'M A PRO
                            </button>
                            <button
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextStep();
                                }}
                            >
                                YES, TEACH ME
                            </button>
                        </div>
                    </div>
                );

            case 'welcome':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Welcome to KaspaClash!</h3>
                        <p className="text-white text-sm leading-relaxed">
                            To begin your journey, connect your wallet to sync your inventory and rank.
                        </p>
                    </div>
                );

            case 'wallet_connect':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Connect Wallet</h3>
                        <p className="text-white text-sm leading-relaxed">
                            Click the button to connect your Kaspa wallet.
                        </p>
                    </div>
                );

            case 'intro_dojo':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Enter the Dojo</h3>
                        <p className="text-white text-sm leading-relaxed">
                            Before you face real opponents, let's learn the basics in the <span className="text-orange-400 font-bold">Practice Mode</span>.
                        </p>
                        <p className="text-zinc-400 text-xs italic">
                            Click the button to enter.
                        </p>
                    </div>
                );

            case 'practice_setup':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Prepare for Battle</h3>
                        <p className="text-white text-sm leading-relaxed">
                            Here you can select your fighter and choose the AI difficulty.
                        </p>
                        <p className="text-white text-sm leading-relaxed">
                            When you are ready, click <span className="text-orange-400 font-bold">START TRAINING</span> to begin the combat tutorial.
                        </p>
                    </div>
                );

            case 'practice_surge':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Phase 1: Power Surge</h3>
                        <div className="space-y-2 text-white text-sm">
                            <p className="text-zinc-300">Before combat begins, choose a <strong className="text-cyber-gold">Power Card</strong>.</p>
                            <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                                <li>Cards can <strong className="text-green-400">BUFF</strong> your stats.</li>
                                <li>Or <strong className="text-red-400">DEBUFF</strong> your opponent.</li>
                                <li>Pick quickly! You only have limited time.</li>
                            </ul>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismissStep('practice_surge');
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                            >
                                I'M READY!
                            </button>
                        </div>
                    </div>
                );

            case 'practice_mode':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Combat Training</h3>
                        <div className="space-y-2 text-white text-sm">
                            <p className="text-zinc-300">Combat is <strong className="text-white">Turn-Based Strategy</strong>.</p>
                            <p className="text-zinc-300">Choose your move wisely:</p>
                            <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                                <li><strong className="text-red-400">PUNCH</strong> beats Special</li>
                                <li><strong className="text-cyan-400">KICK</strong> beats Punch</li>
                                <li><strong className="text-purple-400">SPECIAL</strong> beats Block</li>
                                <li><strong className="text-green-400">BLOCK</strong> reflects Kick</li>
                            </ul>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismissStep('practice_mode');
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                            >
                                I'M READY!
                            </button>
                        </div>
                    </div>
                );

            case 'matchmaking_find':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Find a Match</h3>
                        <p className="text-white text-sm leading-relaxed">
                            You're ready! Click here to find an opponent and start your first ranked match.
                        </p>
                    </div>
                );

            case 'post_game_tour':
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-orange-500 uppercase tracking-wider">Tutorial Complete!</h3>
                        <p className="text-white text-sm leading-relaxed">
                            Try your best and keep fighting!
                        </p>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            If you land in the <strong className="text-cyber-gold">Top 10</strong> in the PvP Leaderboard or Survival Leaderboard, you might get a share of the <strong className="text-green-400">Weekly Distribution</strong> to top players.
                        </p>
                        <div className="flex justify-center mt-4">
                            <button
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
                                onClick={() => {
                                    useTutorialStore.getState().completeTutorial();
                                }}
                            >
                                LET'S FIGHT!
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };


    // Calculate position logic
    // Calculate position logic
    const hasTarget = (currentStep === 'welcome' || currentStep === 'wallet_connect' || currentStep === 'intro_dojo' || currentStep === 'practice_setup' || currentStep === 'matchmaking_find');

    if (hasTarget && !targetRect) {
        return null; // Content relies on target position
    }

    const tooltipStyle: React.CSSProperties = targetRect ? {
        position: 'fixed',
        top: targetRect.bottom + 20,
        left: targetRect.left + (targetRect.width / 2) - 150, // Center roughly
        zIndex: 10000, // Higher than spotlight
    } : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000
    };

    // Adjust if off-screen
    if (targetRect && tooltipStyle.left && (tooltipStyle.left as number) < 10) {
        tooltipStyle.left = 10;
    }
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    if (targetRect && (tooltipStyle.left as number) > screenWidth - 310) {
        tooltipStyle.left = screenWidth - 310;
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9998] pointer-events-none">
                {targetRect ? (
                    <>
                        {/* Spotlight Effect - The Hole with Giant Shadow */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                x: targetRect.left,
                                y: targetRect.top,
                                width: targetRect.width,
                                height: targetRect.height,
                            }}
                            transition={{
                                // Instant updates for scroll performance
                                duration: 0
                            }}
                            className={`absolute top-0 left-0 rounded-lg pointer-events-none ${currentStep === 'practice_setup' ? '' : 'shadow-[0_0_0_9999px_rgba(0,0,0,0.85)]'}`}
                            style={{
                                // Using transform for performance instead of top/left
                                willChange: "transform, width, height"
                            }}
                        >
                            {/* Glowing border around target */}
                            <div className="absolute inset-0 border-2 border-orange-500 rounded-lg animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                        </motion.div>

                        {/* Tooltip */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute w-[300px] bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl pointer-events-auto"
                            style={tooltipStyle}
                        >
                            {/* Arrow */}
                            {targetRect && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-zinc-900 drop-shadow-sm">
                                    <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor">
                                        <path d="M0 12L12 0L24 12H0Z" />
                                    </svg>
                                </div>
                            )}

                            {/* Close Button */}
                            {currentStep !== 'ask_opt_in' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        skipTutorial();
                                    }}
                                    className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors p-1"
                                    aria-label="Close Tutorial"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}

                            {renderContent()}
                        </motion.div>
                    </>
                ) : (
                    // Fallback for non-targeted steps (future proofing)
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-[9999]"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-[300px] bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl relative">
                            {/* Close Button */}
                            {currentStep !== 'ask_opt_in' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        skipTutorial();
                                    }}
                                    className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors p-1"
                                    aria-label="Close Tutorial"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                            {renderContent()}
                        </div>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};
