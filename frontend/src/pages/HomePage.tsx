// ---------------------------------------------------------------------------
// Main page – map + sidebar layout with ATM data loading.
// ---------------------------------------------------------------------------

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
const ATMMap = lazy(() => import('../components/map/ATMMap'));
import Sidebar from '../components/atm/Sidebar';
import ATMDetail from '../components/atm/ATMDetail';
import ReportModal from '../components/atm/ReportModal';
import { getNearbyATMs } from '../api/atm';
import { useGeolocation } from '../hooks/useGeolocation';
import type { NearbyATMResult } from '../types';

export default function HomePage() {
  const geo = useGeolocation();
  const [atms, setAtms] = useState<NearbyATMResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedATMId, setSelectedATMId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reportATM, setReportATM] = useState<NearbyATMResult | null>(null);

  const fetchATMs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNearbyATMs(geo.latitude, geo.longitude, 10);
      setAtms(res.atms);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao carregar ATMs');
    } finally {
      setLoading(false);
    }
  }, [geo.latitude, geo.longitude]);

  // Fetch when geo is ready
  useEffect(() => {
    if (!geo.loading) {
      fetchATMs();
    }
  }, [geo.loading, fetchATMs]);

  function handleSelectATM(id: string) {
    setSelectedATMId(id);
    setShowDetail(true);
  }

  function handleCloseDetail() {
    setShowDetail(false);
  }

  function handleReport(atm: NearbyATMResult) {
    setReportATM(atm);
  }

  function handleReportFromDetail() {
    const atm = atms.find((a) => a.id === selectedATMId);
    if (atm) setReportATM(atm);
  }

  return (
    <div className="home-layout">
      {showDetail && selectedATMId ? (
        <ATMDetail
          atmId={selectedATMId}
          onClose={handleCloseDetail}
          onReport={handleReportFromDetail}
        />
      ) : (
        <Sidebar
          atms={atms}
          loading={loading || geo.loading}
          error={error || geo.error}
          selectedATMId={selectedATMId}
          onSelectATM={handleSelectATM}
          onReport={handleReport}
          onRefresh={fetchATMs}
        />
      )}

      <Suspense fallback={<div className="map-container" />}>
        <ATMMap
          atms={atms}
          userLat={geo.latitude}
          userLng={geo.longitude}
          selectedATMId={selectedATMId}
          onSelectATM={handleSelectATM}
        />
      </Suspense>

      {reportATM && (
        <ReportModal
          atm={reportATM}
          open={!!reportATM}
          onClose={() => setReportATM(null)}
          onReported={() => {
            // Refresh ATM list after report
            fetchATMs();
          }}
        />
      )}
    </div>
  );
}
