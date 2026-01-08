/**
 * Quest Store
 * Zustand store for daily quest state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DailyQuest, QuestStatistics } from '@/types/quest';

interface QuestStore {
  // State
  dailyQuests: DailyQuest[];
  statistics: QuestStatistics | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setDailyQuests: (quests: DailyQuest[]) => void;
  setStatistics: (stats: QuestStatistics) => void;
  updateQuestProgress: (questId: string, newProgress: number) => void;
  markQuestCompleted: (questId: string) => void;
  markQuestClaimed: (questId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState = {
  dailyQuests: [] as DailyQuest[],
  statistics: null as QuestStatistics | null,
  isLoading: false,
  error: null as string | null,
  _hasHydrated: false,
};

export const useQuestStore = create<QuestStore>()(
  persist(
    (set) => ({
      ...initialState,

      setDailyQuests: (quests) => set({ dailyQuests: quests }),

      setStatistics: (stats) => set({ statistics: stats }),

      updateQuestProgress: (questId, newProgress) =>
        set((state) => ({
          dailyQuests: state.dailyQuests.map((quest) =>
            quest.id === questId
              ? { ...quest, currentProgress: newProgress }
              : quest
          ),
        })),

      markQuestCompleted: (questId) =>
        set((state) => ({
          dailyQuests: state.dailyQuests.map((quest) =>
            quest.id === questId
              ? { ...quest, isCompleted: true }
              : quest
          ),
        })),

      markQuestClaimed: (questId) =>
        set((state) => ({
          dailyQuests: state.dailyQuests.map((quest) =>
            quest.id === questId
              ? { ...quest, isClaimed: true, claimedAt: new Date() }
              : quest
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'quest-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
