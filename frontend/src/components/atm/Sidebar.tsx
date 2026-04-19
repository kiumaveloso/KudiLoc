// ---------------------------------------------------------------------------
// Sidebar – ATM list with search and filter controls.
// ---------------------------------------------------------------------------

import { useState, useMemo } from 'react';
import type { NearbyATMResult } from '../../types';
import ATMCard from './ATMCard';
import Spinner from '../ui/Spinner';

interface Props {
  atms: NearbyATMResult[];
  loading: boolean;
  error: string | null;
  selectedATMId: string | null;
  onSelectATM: (id: string) => void;
  onReport: (atm: NearbyATMResult) => void;
  onRefresh: () => void;
}

type FilterStatus = 'all' | 'available' | 'unavailable' | 'maintenance';

export default function Sidebar({
  atms,
  loading,
  error,
  selectedATMId,
  onSelectATM,
  onReport,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [collapsed, setCollapsed] = useState(false);

  // Derive unique bank names for potential filter extension
  const bankNames = useMemo(
    () => [...new Set(atms.map((a) => a.bankName))].sort(),
    [atms],
  );
  const [bankFilter, setBankFilter] = useState('');

  const filteredATMs = useMemo(() => {
    let result = atms;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bankName.toLowerCase().includes(q) ||
          a.address?.street?.toLowerCase().includes(q) ||
          a.address?.neighborhood?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((a) => {
        if (statusFilter === 'available') return a.status.hasMoney;
        if (statusFilter === 'unavailable') return !a.status.hasMoney && a.status.operationalStatus !== 'maintenance';
        if (statusFilter === 'maintenance') return a.status.operationalStatus === 'maintenance';
        return true;
      });
    }

    // Bank filter
    if (bankFilter) {
      result = result.filter((a) => a.bankName === bankFilter);
    }

    return result;
  }, [atms, search, statusFilter, bankFilter]);

  // Count by status
  const counts = useMemo(() => {
    const available = atms.filter((a) => a.status.hasMoney).length;
    const total = atms.length;
    return { available, unavailable: total - available, total };
  }, [atms]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Toggle button (mobile) */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expandir lista' : 'Recolher lista'}
      >
        {collapsed ? '>' : '<'}
      </button>

      {!collapsed && (
        <>
          <div className="sidebar-header">
            <h2 className="sidebar-title">ATMs próximos</h2>
            <button className="btn btn-icon" onClick={onRefresh} title="Atualizar">
              &#8635;
            </button>
          </div>

          {/* Status summary */}
          <div className="status-summary">
            <div className="summary-item green">
              <span className="summary-count">{counts.available}</span>
              <span className="summary-label">Disponíveis</span>
            </div>
            <div className="summary-item red">
              <span className="summary-count">{counts.unavailable}</span>
              <span className="summary-label">Indisponíveis</span>
            </div>
            <div className="summary-item gray">
              <span className="summary-count">{counts.total}</span>
              <span className="summary-label">Total</span>
            </div>
          </div>

          {/* Search */}
          <div className="sidebar-search">
            <input
              type="text"
              className="form-input"
              placeholder="Pesquisar ATM, banco, morada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="sidebar-filters">
            <select
              className="form-input filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            >
              <option value="all">Todos os estados</option>
              <option value="available">Com dinheiro</option>
              <option value="unavailable">Sem dinheiro</option>
              <option value="maintenance">Manutenção</option>
            </select>
            <select
              className="form-input filter-select"
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
            >
              <option value="">Todos os bancos</option>
              {bankNames.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="sidebar-list">
            {loading ? (
              <div className="sidebar-loading">
                <Spinner size={28} />
                <p>A carregar ATMs...</p>
              </div>
            ) : error ? (
              <div className="sidebar-error">
                <p>{error}</p>
                <button className="btn btn-small btn-primary" onClick={onRefresh}>
                  Tentar novamente
                </button>
              </div>
            ) : filteredATMs.length === 0 ? (
              <p className="empty-text">Nenhum ATM encontrado.</p>
            ) : (
              filteredATMs.map((atm) => (
                <ATMCard
                  key={atm.id}
                  atm={atm}
                  selected={atm.id === selectedATMId}
                  onClick={() => onSelectATM(atm.id)}
                  onReport={() => onReport(atm)}
                />
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}
