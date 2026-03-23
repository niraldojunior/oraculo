import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Tente niraldojunior@gmail.com / 123');
    }
    setLoading(false);
  };

  return (
    <div className="flex-center" style={{ height: '100vh', background: 'radial-gradient(circle at top left, var(--bg-card), var(--bg-dark))' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="flex-center" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-base)', margin: '0 auto 1rem' }}>
             <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>O</span>
          </div>
          <h2>Oráculo SSOT</h2>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Acesso Restrito - Diretoria de TI</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="badge badge-red" style={{ justifyContent: 'center', padding: '0.75rem' }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>E-mail Funcional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-panel"
              style={{ width: '100%', padding: '0.75rem 1rem', outline: 'none', color: 'var(--text-primary)', border: '1px solid var(--glass-border-strong)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-panel"
              style={{ width: '100%', padding: '0.75rem 1rem', outline: 'none', color: 'var(--text-primary)', border: '1px solid var(--glass-border-strong)' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Autenticando...' : 'Acessar Plataforma'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
