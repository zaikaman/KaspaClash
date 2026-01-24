/**
 * Shop Store
 * Zustand store for cosmetic shop state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CosmeticItem, ShopRotation, PlayerCurrency } from '@/types/cosmetic';

interface ShopStore {
  // State
  items: CosmeticItem[];
  featuredRotation: ShopRotation | null;
  currency: PlayerCurrency | null;
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: 'newest' | 'price-low' | 'price-high' | 'rarity';
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setItems: (items: CosmeticItem[]) => void;
  setFeaturedRotation: (rotation: ShopRotation) => void;
  setCurrency: (currency: PlayerCurrency) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'newest' | 'price-low' | 'price-high' | 'rarity') => void;
  updateCurrencyBalance: (newBalance: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
  fetchCurrency: (playerId: string) => Promise<void>;
}

const initialState = {
  items: [] as CosmeticItem[],
  featuredRotation: null as ShopRotation | null,
  currency: null as PlayerCurrency | null,
  selectedCategory: null as string | null,
  searchQuery: '',
  sortBy: 'newest' as const,
  isLoading: false,
  error: null as string | null,
  _hasHydrated: false,
};

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setItems: (items) => set({ items }),

      setFeaturedRotation: (rotation) => set({ featuredRotation: rotation }),

      setCurrency: (currency) => set({ currency }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSortBy: (sort) => set({ sortBy: sort }),

      updateCurrencyBalance: (newBalance) =>
        set((state) => {
          if (!state.currency) return state;

          return {
            currency: {
              ...state.currency,
              clashShards: newBalance,
              lastUpdated: new Date(),
            },
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      fetchCurrency: async (playerId: string) => {
        if (!playerId) return;
        try {
          // Use lightweight currency endpoint
          const response = await fetch(`/api/currency/${playerId}`);
          if (response.ok) {
            const data = await response.json();
            set({
              currency: {
                playerId: playerId,
                clashShards: data.clash_shards || 0,
                totalEarned: data.total_earned || 0,
                totalSpent: data.total_spent || 0,
                lastUpdated: new Date(),
              }
            });
          }
        } catch (err) {
          console.error("Error fetching currency:", err);
        }
      },
    }),
    {
      name: 'shop-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Don't persist search/filter state (reset on page refresh)
      partialize: (state) => ({
        ...state,
        selectedCategory: null,
        searchQuery: '',
        sortBy: 'newest' as const,
      }),
    }
  )
);
