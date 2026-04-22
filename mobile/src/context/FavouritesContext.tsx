// ---------------------------------------------------------------------------
// Shared favourites context — single source of truth for the starred ATM IDs.
// All screens that call useFavourites() share the same in-memory Set, so
// toggling a favourite in the ATM detail screen is immediately reflected in
// the list screen without needing a re-fetch or navigation event.
// ---------------------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORE_KEY = 'kudiloc_favourites';

async function loadFavs(): Promise<Set<string>> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
    } else {
      raw = await SecureStore.getItemAsync(STORE_KEY);
    }
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

async function saveFavs(favs: Set<string>): Promise<void> {
  const raw = JSON.stringify(Array.from(favs));
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, raw);
    } else {
      await SecureStore.setItemAsync(STORE_KEY, raw);
    }
  } catch {}
}

interface FavouritesState {
  favs: Set<string>;
  isFav: (id: string) => boolean;
  toggle: (id: string) => void;
}

const FavouritesContext = createContext<FavouritesState | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavs().then(setFavs);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavs(next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favs.has(id), [favs]);

  return (
    <FavouritesContext.Provider value={{ favs, isFav, toggle }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesState {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
}
