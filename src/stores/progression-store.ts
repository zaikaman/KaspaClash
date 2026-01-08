/**
 * Progression Store
 * Zustand store for battle pass progression state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProgression, BattlePassSeason, BattlePassTier, PrestigeStatus } from '@/types/progression';

interface ProgressionStore {
  // State
  currentSeason: BattlePassSeason | null;
  progression: PlayerProgression | null;
  tiers: BattlePassTier[];
  prestigeStatus: PrestigeStatus | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setCurrentSeason: (season: BattlePassSeason) => void;
  setProgression: (progression: PlayerProgression) => void;
  setTiers: (tiers: BattlePassTier[]) => void;
  setPrestigeStatus: (status: PrestigeStatus) => void;
  updateProgress: (xpGained: number, newTier: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState = {
  currentSeason: null as BattlePassSeason | null,
  progression: null as PlayerProgression | null,
  tiers: [] as BattlePassTier[],
  prestigeStatus: null as PrestigeStatus | null,
  isLoading: false,
  error: null as string | null,
  _hasHydrated: false,
};

export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentSeason: (season) => set({ currentSeason: season }),

      setProgression: (progression) => set({ progression }),

      setTiers: (tiers) => set({ tiers }),

      setPrestigeStatus: (status) => set({ prestigeStatus: status }),

      updateProgress: (xpGained, newTier) =>
        set((state) => {
          if (!state.progression) return state;
          
          return {
            progression: {
              ...state.progression,
              currentXP: state.progression.currentXP + xpGained,
              totalXP: state.progression.totalXP + xpGained,
              currentTier: newTier,
              lastUpdated: new Date(),
            },
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'progression-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
