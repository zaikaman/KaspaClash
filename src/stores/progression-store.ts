/**
 * Progression Store
 * Zustand store for battle pass progression state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProgression, BattlePassSeason, BattlePassTier, PrestigeStatus } from '@/types/progression';
import { useWalletStore } from '@/stores/wallet-store';

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
  /** Set the current season directly */
  setCurrentSeason: (season: BattlePassSeason) => void;
  /** Set player progression directly */
  setProgression: (progression: PlayerProgression) => void;
  /** Set tier definitions directly */
  setTiers: (tiers: BattlePassTier[]) => void;
  /** Set prestige status directly */
  setPrestigeStatus: (status: PrestigeStatus) => void;
  /** Optimistically update progress */
  updateProgress: (xpGained: number, newTier: number) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Set hydration state (internal) */
  setHasHydrated: (state: boolean) => void;

  // Async Fetch Actions
  /** Fetch the currently active season */
  fetchCurrentSeason: () => Promise<void>;
  /** Fetch the connected player's progression for the current season */
  fetchPlayerProgression: () => Promise<void>;
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
    (set, get) => ({
      ...initialState,

      setCurrentSeason: (season) => set({ currentSeason: season }),

      setProgression: (progression) => set({ progression }),

      setTiers: (tiers) => set({ tiers }),

      setPrestigeStatus: (status) => set({ prestigeStatus: status }),

      updateProgress: (xpGained, newTier) => {
        const { progression } = get();
        if (!progression) return;

        set({
          progression: {
            ...progression,
            currentXP: progression.currentXP + xpGained,
            totalXP: progression.totalXP + xpGained,
            currentTier: newTier,
          },
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Async Actions Implementation
      fetchCurrentSeason: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/progression/season');
          if (!response.ok) {
            throw new Error('Failed to fetch season');
          }
          const data = await response.json();
          // API returns { season: ... }

          if (data.season) {
            set({ currentSeason: data.season });
          }
        } catch (err) {
          console.error("Failed to fetch season:", err);
          // Don't set global error for season fetch failure to avoid blocking UI too aggressively
        } finally {
          set({ isLoading: false });
        }
      },

      fetchPlayerProgression: async () => {
        // Get address from wallet store
        const { address } = useWalletStore.getState();

        if (!address) {
          set({ progression: null, prestigeStatus: null });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/progression/player/${address}`);
          if (!response.ok) {
            if (response.status === 404) {
              set({ progression: null });
              return;
            }
            throw new Error('Failed to fetch player progression');
          }
          const data = await response.json();
          // Route returns: NextResponse.json({ progression, tierProgress, currencyBalance })

          if (data.progression) {
            set({
              progression: data.progression,
              // We could also store derived data if needed
            });
            // If prestige status is part of progression or separate?
            // Progression interface has prestigeLevel.
          }
        } catch (err) {
          console.error("Failed to fetch player progression:", err);
          set({ error: 'Failed to load progression data' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'progression-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        currentSeason: state.currentSeason,
        progression: state.progression,
        tiers: state.tiers,
        prestigeStatus: state.prestigeStatus,
      }),
    }
  )
);
