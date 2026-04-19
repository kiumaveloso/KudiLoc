// ---------------------------------------------------------------------------
// Leaderboard page – top contributors ranking.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/user';
import type { LeaderboardEntry } from '../types';
import Spinner from '../components/ui/Spinner';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLeaderboard(50);
        setEntries(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="page-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <h2>Classificação de Contribuidores</h2>
      <p className="page-subtitle">
        Os utilizadores que mais ajudam a comunidade reportando o estado dos ATMs.
      </p>
      <div className="leaderboard-list">
        {entries.map((e, i) => (
          <div key={e.userId} className="leaderboard-row">
            <span className="lb-rank">
              {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `${i + 1}`}
            </span>
            <div className="lb-info">
              <strong>{e.name ?? 'Anónimo'}</strong>
              <span className="lb-stats">
                {e.totalReports} relatórios &middot; {e.reputationScore} pts
              </span>
            </div>
            {e.badges.length > 0 && (
              <div className="lb-badges">
                {e.badges.map((b) => (
                  <span key={b.id} className="badge" title={b.badgeType}>
                    {b.badgeType}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
