// ---------------------------------------------------------------------------
// App header with auth controls
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-logo">
          <span className="logo-kudi">Kudi</span>
          <span className="logo-loc">Loc</span>
        </h1>
        <span className="header-tagline">Encontre ATMs com dinheiro em Angola</span>
      </div>

      <div className="header-right">
        {isAuthenticated && user ? (
          <div className="user-menu">
            <button
              className="user-avatar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title={user.name ?? 'Utilizador'}
            >
              <span className="user-avatar">
                {(user.name ?? 'U')[0].toUpperCase()}
              </span>
              <span className="user-name-label">{user.name ?? 'Utilizador'}</span>
            </button>
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <strong>{user.name ?? 'Utilizador'}</strong>
                  <span className="reputation-badge">
                    {user.reputationScore} pts
                  </span>
                </div>
                <div className="dropdown-stat">
                  Relatórios: {user.totalReports}
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Terminar sessão
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-outline"
            onClick={() => setLoginOpen(true)}
          >
            Entrar
          </button>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
