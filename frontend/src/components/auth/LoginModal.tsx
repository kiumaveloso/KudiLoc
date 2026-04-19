// ---------------------------------------------------------------------------
// Phone OTP login modal
// ---------------------------------------------------------------------------

import { useState, type FormEvent } from 'react';
import { requestOtp, verifyOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'otp';

export default function LoginModal({ open, onClose }: Props) {
  const { onLoginSuccess } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao enviar OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await verifyOtp(phone, otp);
      onLoginSuccess(auth);
      onClose();
      // Reset
      setStep('phone');
      setPhone('');
      setOtp('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Código OTP inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          &times;
        </button>
        <h2 className="modal-title">Entrar no KudiLoc</h2>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp}>
            <label className="form-label" htmlFor="phone">
              Número de telefone
            </label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="+244 9XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="form-hint">
              Enviámos um código para <strong>{phone}</strong>
            </p>
            <label className="form-label" htmlFor="otp">
              Código OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              className="form-input otp-input"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Verificar'}
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => {
                setStep('phone');
                setError('');
                setOtp('');
              }}
            >
              Alterar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
