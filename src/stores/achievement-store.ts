/**
 * Achievement Store
 * Zustand store for achievement tracking state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Achievement, PlayerAchievement, PlayerAchievementSummary } from '@/types/achievement';

interface AchievementStore {
  // State
  achievements: Achievement[];
  playerAchievements: PlayerAchievement[];
  summary: PlayerAchievementSummary | null;
  selectedCategory: string | null;
  showUnlockedOnly: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setAchievements: (achievements: Achievement[]) => void;
  setPlayerAchievements: (playerAchievements: PlayerAchievement[]) => void;
  setSummary: (summary: PlayerAchievementSummary) => void;
  setSelectedCategory: (category: string | null) => void;
  setShowUnlockedOnly: (showUnlocked: boolean) => void;
  updateAchievementProgress: (achievementId: string, newProgress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;

  // Selectors
  getAchievementById: (achievementId: string) => Achievement | undefined;
  getPlayerAchievementById: (achievementId: string) => PlayerAchievement | undefined;
  getAchievementsByCategory: (category: string) => PlayerAchievement[];
  getUnlockedCount: () => number;
  getTotalCount: () => number;
}

const initialState = {
  achievements: [] as Achievement[],
  playerAchievements: [] as PlayerAchievement[],
  summary: null as PlayerAchievementSummary | null,
  selectedCategory: null as string | null,
  showUnlockedOnly: false,
  isLoading: false,
  error: null as string | null,
  _hasHydrated: false,
};

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAchievements: (achievements) => set({ achievements }),

      setPlayerAchievements: (playerAchievements) => set({ playerAchievements }),

      setSummary: (summary) => set({ summary }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setShowUnlockedOnly: (showUnlocked) => set({ showUnlockedOnly: showUnlocked }),

      updateAchievementProgress: (achievementId, newProgress) =>
        set((state) => ({
          playerAchievements: state.playerAchievements.map((pa) =>
            pa.achievementId === achievementId
              ? {
                  ...pa,
                  currentProgress: newProgress,
                  progressPercentage: (newProgress / pa.targetProgress) * 100,
                }
              : pa
          ),
        })),

      unlockAchievement: (achievementId) =>
        set((state) => ({
          playerAchievements: state.playerAchievements.map((pa) =>
            pa.achievementId === achievementId
              ? {
                  ...pa,
                  isUnlocked: true,
                  unlockedAt: new Date(),
                }
              : pa
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Selectors
      getAchievementById: (achievementId) =>
        get().achievements.find((a) => a.id === achievementId),

      getPlayerAchievementById: (achievementId) =>
        get().playerAchievements.find((pa) => pa.achievementId === achievementId),

      getAchievementsByCategory: (category) =>
        get().playerAchievements.filter((pa) => pa.achievement.category === category),

      getUnlockedCount: () =>
        get().playerAchievements.filter((pa) => pa.isUnlocked).length,

      getTotalCount: () => get().playerAchievements.length,
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Don't persist filter state (reset on page refresh)
      partialize: (state) => ({
        ...state,
        selectedCategory: null,
        showUnlockedOnly: false,
      }),
    }
  )
);
