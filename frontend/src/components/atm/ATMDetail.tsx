// ---------------------------------------------------------------------------
// ATM detail panel – shown when an ATM is selected.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { getATMById, getATMReports, getATMComments, addComment, markCommentHelpful } from '../../api/atm';
import { useAuth } from '../../context/AuthContext';
import { getStatusColor, getStatusLabel, timeAgo } from '../../utils/format';
import Spinner from '../ui/Spinner';
import type { ATMDto, StatusReportResponse, CommentDto } from '../../types';

interface Props {
  atmId: string;
  onClose: () => void;
  onReport: () => void;
}

export default function ATMDetail({ atmId, onClose, onReport }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [atm, setAtm] = useState<ATMDto | null>(null);
  const [reports, setReports] = useState<StatusReportResponse[]>([]);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [tab, setTab] = useState<'info' | 'reports' | 'comments'>('info');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r, c] = await Promise.all([
        getATMById(atmId),
        getATMReports(atmId).catch(() => ({ items: [] })),
        getATMComments(atmId).catch(() => []),
      ]);
      setAtm(a);
      setReports((r as { items: StatusReportResponse[] }).items ?? []);
      setComments(c as CommentDto[]);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [atmId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddComment() {
    if (!commentText.trim() || !user) return;
    setSubmittingComment(true);
    try {
      const c = await addComment(atmId, user.id, user.name ?? 'Anónimo', commentText.trim());
      setComments((prev) => [c, ...prev]);
      setCommentText('');
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleHelpful(id: string) {
    try {
      const updated = await markCommentHelpful(id);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="detail-panel">
        <div className="detail-loading"><Spinner size={32} /></div>
      </div>
    );
  }

  if (!atm) {
    return (
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose}>&larr; Voltar</button>
        <p>ATM não encontrado.</p>
      </div>
    );
  }

  const color = getStatusColor(atm.status.hasMoney, undefined, atm.status.operationalStatus);
  const label = getStatusLabel(atm.status.hasMoney, undefined, atm.status.operationalStatus);

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>&larr; Voltar</button>

      <div className="detail-header">
        <span className="atm-status-dot large" style={{ backgroundColor: color }} />
        <div>
          <h2 className="detail-name">{atm.name}</h2>
          <p className="detail-bank">{atm.bankName}</p>
        </div>
      </div>

      <div className="detail-status" style={{ borderLeftColor: color }}>
        <strong style={{ color }}>{label}</strong>
        <span> &mdash; Confiança: {atm.status.reliabilityScore}%</span>
        <br />
        <small>Última verificação: {timeAgo(atm.status.lastVerified)}</small>
        <br />
        <small>{atm.status.totalReports} relatórios no total</small>
      </div>

      <button className="btn btn-primary btn-block" onClick={onReport}>
        Reportar estado deste ATM
      </button>

      {/* Tabs */}
      <div className="detail-tabs">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
          Informações
        </button>
        <button className={`tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          Relatórios ({reports.length})
        </button>
        <button className={`tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>
          Comentários ({comments.length})
        </button>
      </div>

      {tab === 'info' && (
        <div className="detail-info">
          <div className="info-row">
            <span className="info-label">Morada</span>
            <span>{atm.address.street}, {atm.address.neighborhood}</span>
          </div>
          {atm.address.landmark && (
            <div className="info-row">
              <span className="info-label">Referência</span>
              <span>{atm.address.landmark}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Província</span>
            <span>{atm.location.province}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Município</span>
            <span>{atm.location.municipality}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Recibo</span>
            <span>{atm.status.hasPaper ? 'Sim' : 'Não'}</span>
          </div>
          {atm.supportedServices.length > 0 && (
            <div className="info-row">
              <span className="info-label">Serviços</span>
              <span>{atm.supportedServices.join(', ')}</span>
            </div>
          )}
          {atm.photoUrls.length > 0 && (
            <div className="detail-photos">
              {atm.photoUrls.map((url, i) => (
                <img key={i} src={url} alt={`ATM foto ${i + 1}`} className="detail-photo" />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="detail-reports">
          {reports.length === 0 ? (
            <p className="empty-text">Nenhum relatório recente.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="report-item">
                <span
                  className="atm-status-dot"
                  style={{ backgroundColor: r.hasCash ? '#22c55e' : '#ef4444' }}
                />
                <div>
                  <strong>{r.hasCash ? 'Com dinheiro' : 'Sem dinheiro'}</strong>
                  {r.notes && <p className="report-notes">{r.notes}</p>}
                  <small>{timeAgo(r.reportedAt)}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="detail-comments">
          {isAuthenticated && (
            <div className="comment-form">
              <textarea
                className="form-input"
                rows={2}
                placeholder="Adicionar comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
              />
              <button
                className="btn btn-small btn-primary"
                onClick={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? <Spinner size={14} /> : 'Comentar'}
              </button>
            </div>
          )}
          {comments.length === 0 ? (
            <p className="empty-text">Nenhum comentário.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <strong>{c.userName}</strong>
                  <small>{timeAgo(c.createdAt)}</small>
                </div>
                <p className="comment-text">{c.text}</p>
                <button
                  className="btn-helpful"
                  onClick={() => handleHelpful(c.id)}
                  title="Marcar como útil"
                >
                  Útil ({c.helpfulCount})
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
