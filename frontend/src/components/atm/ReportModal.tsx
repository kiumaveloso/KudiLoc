// ---------------------------------------------------------------------------
// ATM status reporting modal – lets users crowdsource ATM status.
// ---------------------------------------------------------------------------

import { useState, type FormEvent } from 'react';
import { submitStatusReport } from '../../api/atm';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';
import type { ATMDto, NearbyATMResult } from '../../types';

type ATMLike = ATMDto | NearbyATMResult | { id: string; name: string; bankName: string };

interface Props {
  atm: ATMLike;
  open: boolean;
  onClose: () => void;
  onReported?: () => void;
}

export default function ReportModal({ atm, open, onClose, onReported }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [hasCash, setHasCash] = useState<boolean | null>(null);
  const [hasPaper, setHasPaper] = useState(true);
  const [operationalStatus, setOperationalStatus] = useState('operational');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasCash === null) {
      setError('Por favor, indique se o ATM tem dinheiro.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitStatusReport({
        atmId: atm.id,
        userId: user?.id,
        hasCash,
        hasPaper,
        operationalStatus,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      onReported?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setHasCash(null);
        setHasPaper(true);
        setOperationalStatus('operational');
        setNotes('');
      }, 1500);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao submeter relatório');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-report" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          &times;
        </button>

        <h2 className="modal-title">Reportar estado do ATM</h2>
        <p className="modal-subtitle">
          {atm.name} &mdash; {atm.bankName}
        </p>

        {success ? (
          <div className="report-success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>Obrigado! O seu relatório foi submetido.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Cash availability */}
            <fieldset className="form-fieldset">
              <legend className="form-label">O ATM tem dinheiro?</legend>
              <div className="radio-group">
                <label className={`radio-card ${hasCash === true ? 'selected green' : ''}`}>
                  <input
                    type="radio"
                    name="hasCash"
                    checked={hasCash === true}
                    onChange={() => setHasCash(true)}
                  />
                  <span className="radio-icon">&#10003;</span>
                  Sim
                </label>
                <label className={`radio-card ${hasCash === false ? 'selected red' : ''}`}>
                  <input
                    type="radio"
                    name="hasCash"
                    checked={hasCash === false}
                    onChange={() => setHasCash(false)}
                  />
                  <span className="radio-icon">&times;</span>
                  Não
                </label>
              </div>
            </fieldset>

            {/* Paper receipt */}
            <fieldset className="form-fieldset">
              <legend className="form-label">Emite papel (recibo)?</legend>
              <div className="radio-group">
                <label className={`radio-card small ${hasPaper ? 'selected green' : ''}`}>
                  <input
                    type="radio"
                    name="hasPaper"
                    checked={hasPaper}
                    onChange={() => setHasPaper(true)}
                  />
                  Sim
                </label>
                <label className={`radio-card small ${!hasPaper ? 'selected red' : ''}`}>
                  <input
                    type="radio"
                    name="hasPaper"
                    checked={!hasPaper}
                    onChange={() => setHasPaper(false)}
                  />
                  Não
                </label>
              </div>
            </fieldset>

            {/* Operational status */}
            <div className="form-group">
              <label className="form-label" htmlFor="opStatus">
                Estado operacional
              </label>
              <select
                id="opStatus"
                className="form-input"
                value={operationalStatus}
                onChange={(e) => setOperationalStatus(e.target.value)}
              >
                <option value="operational">Operacional</option>
                <option value="maintenance">Em manutenção</option>
                <option value="offline">Fora de serviço</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                className="form-input"
                rows={2}
                placeholder="Ex: Fila grande, só dá notas de 5000 Kz..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            {!isAuthenticated && (
              <p className="form-hint">
                Pode reportar sem conta, mas entrar aumenta a sua reputação.
              </p>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Submeter relatório'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
