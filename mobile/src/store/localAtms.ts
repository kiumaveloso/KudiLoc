// ---------------------------------------------------------------------------
// Local ATM store — holds ATMs added in demo mode so they appear in the UI
// without needing a real backend write.
// ---------------------------------------------------------------------------

import type { NearbyATMResult } from '../types';

const _atms: NearbyATMResult[] = [];

export function addLocalAtm(atm: NearbyATMResult): void {
  // Avoid duplicates
  if (!_atms.find((a) => a.id === atm.id)) {
    _atms.unshift(atm);
  }
}

export function removeLocalAtm(id: string): void {
  const idx = _atms.findIndex((a) => a.id === id);
  if (idx !== -1) _atms.splice(idx, 1);
}

export function getLocalAtms(): NearbyATMResult[] {
  return [..._atms];
}
