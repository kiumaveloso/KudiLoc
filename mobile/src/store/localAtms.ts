// ---------------------------------------------------------------------------
// Local ATM store — holds ATMs added in demo mode so they appear in the UI
// without needing a real backend write.
// ---------------------------------------------------------------------------

import type { NearbyATMResult } from '../types';

const _atms: NearbyATMResult[] = [];

// Simple pub-sub so map/list screens can react to status changes instantly
type StatusListener = (id: string, cash: 'has' | 'no' | 'offline') => void;
const _listeners = new Set<StatusListener>();

export function subscribeToStatusChanges(fn: StatusListener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notifyStatusChange(id: string, cash: 'has' | 'no' | 'offline') {
  _listeners.forEach((fn) => fn(id, cash));
}

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

export function updateLocalAtmStatus(id: string, cash: 'has' | 'no' | 'offline'): void {
  const atm = _atms.find((a) => a.id === id);
  if (atm) {
    atm.status = {
      ...atm.status,
      hasCash: cash === 'has',
      hasMoney: cash === 'has',
      operationalStatus: cash === 'offline' ? 'Offline' : 'Operational',
      lastVerified: new Date().toISOString(),
    };
  }
  _notifyStatusChange(id, cash);
}

export function getLocalAtms(): NearbyATMResult[] {
  return [..._atms];
}
