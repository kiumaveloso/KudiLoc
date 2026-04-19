// ---------------------------------------------------------------------------
// ATM card – used in the sidebar list and detail view.
// ---------------------------------------------------------------------------

import type { NearbyATMResult } from '../../types';
import { formatDistance, formatWalkingTime, getStatusColor, getStatusLabel, timeAgo } from '../../utils/format';

interface Props {
  atm: NearbyATMResult;
  selected?: boolean;
  onClick?: () => void;
  onReport?: () => void;
}

export default function ATMCard({ atm, selected, onClick, onReport }: Props) {
  const color = getStatusColor(
    atm.status.hasMoney,
    undefined,
    atm.status.operationalStatus,
  );
  const label = getStatusLabel(
    atm.status.hasMoney,
    undefined,
    atm.status.operationalStatus,
  );

  return (
    <div
      className={`atm-card ${selected ? 'atm-card-selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="atm-card-header">
        <span className="atm-status-dot" style={{ backgroundColor: color }} />
        <span className="atm-bank-name">{atm.bankName}</span>
        {atm.distanceKm != null && (
          <span className="atm-distance">{formatDistance(atm.distanceKm)}</span>
        )}
      </div>
      <div className="atm-card-name">{atm.name}</div>
      <div className="atm-card-address">
        {atm.address?.street}
        {atm.address?.neighborhood ? `, ${atm.address.neighborhood}` : ''}
      </div>
      <div className="atm-card-meta">
        <span className="atm-status-label" style={{ color }}>
          {label}
        </span>
        {atm.status.hasPaper && (
          <span className="atm-paper-badge" title="Emite recibo">Recibo</span>
        )}
        {atm.estimatedWalkingTime > 0 && (
          <span className="atm-walk-time">
            {formatWalkingTime(atm.estimatedWalkingTime)} a pé
          </span>
        )}
      </div>
      <div className="atm-card-footer">
        <span className="atm-reliability">
          Confiança: {atm.status.reliabilityScore}%
        </span>
        <span className="atm-last-report">
          {timeAgo(atm.status.lastVerified)}
        </span>
      </div>
      {onReport && (
        <button
          className="btn btn-small btn-report"
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
        >
          Reportar estado
        </button>
      )}
    </div>
  );
}
