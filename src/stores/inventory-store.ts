/**
 * Inventory Store
 * Zustand store for player inventory and loadout state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerInventoryItem, PlayerLoadout, CosmeticItem } from '@/types/cosmetic';

interface InventoryStore {
  // State
  inventory: PlayerInventoryItem[];
  loadouts: Record<string, PlayerLoadout>; // Keyed by characterId
  selectedCharacter: string | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setInventory: (items: PlayerInventoryItem[]) => void;
  addInventoryItem: (item: PlayerInventoryItem) => void;
  setLoadouts: (loadouts: PlayerLoadout[]) => void;
  updateLoadout: (characterId: string, loadout: Partial<PlayerLoadout>) => void;
  setSelectedCharacter: (characterId: string | null) => void;
  equipItem: (characterId: string, cosmeticId: string, slot: string) => void;
  unequipItem: (characterId: string, slot: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;

  // Selectors
  getLoadout: (characterId: string) => PlayerLoadout | null;
  hasItem: (cosmeticId: string) => boolean;
  getItemsByCategory: (category: string) => PlayerInventoryItem[];
}

const initialState = {
  inventory: [] as PlayerInventoryItem[],
  loadouts: {} as Record<string, PlayerLoadout>,
  selectedCharacter: null as string | null,
  isLoading: false,
  error: null as string | null,
  _hasHydrated: false,
};

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setInventory: (items) => set({ inventory: items }),

      addInventoryItem: (item) =>
        set((state) => ({
          inventory: [...state.inventory, item],
        })),

      setLoadouts: (loadouts) =>
        set({
          loadouts: loadouts.reduce(
            (acc, loadout) => ({
              ...acc,
              [loadout.characterId]: loadout,
            }),
            {}
          ),
        }),

      updateLoadout: (characterId, loadout) =>
        set((state) => ({
          loadouts: {
            ...state.loadouts,
            [characterId]: {
              ...state.loadouts[characterId],
              ...loadout,
              lastUpdated: new Date(),
            },
          },
        })),

      setSelectedCharacter: (characterId) => set({ selectedCharacter: characterId }),

      equipItem: (characterId, cosmeticId, slot) =>
        set((state) => {
          const currentLoadout = state.loadouts[characterId] || {
            playerId: '',
            characterId,
            lastUpdated: new Date(),
          };

          return {
            loadouts: {
              ...state.loadouts,
              [characterId]: {
                ...currentLoadout,
                [`equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`]: cosmeticId,
                lastUpdated: new Date(),
              },
            },
          };
        }),

      unequipItem: (characterId, slot) =>
        set((state) => {
          const currentLoadout = state.loadouts[characterId];
          if (!currentLoadout) return state;

          return {
            loadouts: {
              ...state.loadouts,
              [characterId]: {
                ...currentLoadout,
                [`equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`]: undefined,
                lastUpdated: new Date(),
              },
            },
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Selectors
      getLoadout: (characterId) => get().loadouts[characterId] || null,

      hasItem: (cosmeticId) =>
        get().inventory.some((item) => item.cosmeticId === cosmeticId),

      getItemsByCategory: (category) =>
        get().inventory.filter((item) => item.cosmetic.category === category),
    }),
    {
      name: 'inventory-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
