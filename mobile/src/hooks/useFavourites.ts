// ---------------------------------------------------------------------------
// Persisted favourites — stores a Set of ATM IDs in SecureStore / localStorage
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'kudiloc_favourites';

async function loadFavs(): Promise<Set<string>> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    } else {
      raw = await SecureStore.getItemAsync(KEY);
    }
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

async function saveFavs(favs: Set<string>): Promise<void> {
  const raw = JSON.stringify(Array.from(favs));
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, raw);
    } else {
      await SecureStore.setItemAsync(KEY, raw);
    }
  } catch {}
}

export function useFavourites() {
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavs().then(setFavs);
  }, []);

  const toggle = (id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavs(next);
      return next;
    });
  };

  return { favs, isFav: (id: string) => favs.has(id), toggle };
}
