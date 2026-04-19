// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Return a human-readable "time ago" string in Portuguese.
 */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Desconhecido';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-AO');
}

/**
 * Format distance in km to a readable string.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Format walking time estimate.
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
}

/**
 * Get status color based on ATM cash/online status.
 */
export function getStatusColor(
  hasMoney?: boolean,
  isOnline?: string,
  operationalStatus?: string,
): string {
  // Check operational status first
  if (operationalStatus === 'offline' || isOnline === 'false' || isOnline === 'offline') {
    return '#ef4444'; // red
  }
  if (operationalStatus === 'maintenance') {
    return '#f59e0b'; // amber
  }
  // Cash availability
  if (hasMoney === true || isOnline === 'true' || isOnline === 'online') {
    return '#22c55e'; // green
  }
  if (hasMoney === false) {
    return '#ef4444'; // red
  }
  return '#94a3b8'; // gray (unknown)
}

/**
 * Get human-readable status label in Portuguese.
 */
export function getStatusLabel(
  hasMoney?: boolean,
  isOnline?: string,
  operationalStatus?: string,
): string {
  if (operationalStatus === 'offline' || isOnline === 'false' || isOnline === 'offline') {
    return 'Fora de serviço';
  }
  if (operationalStatus === 'maintenance') {
    return 'Em manutenção';
  }
  if (hasMoney === true || isOnline === 'true' || isOnline === 'online') {
    return 'Disponível';
  }
  if (hasMoney === false) {
    return 'Sem dinheiro';
  }
  return 'Estado desconhecido';
}
