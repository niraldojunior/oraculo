import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      window.location.href = '/';
    } else {
      // Differentiate between 401 (Wrong credentials) and 500+ (Server/DB issues)
      if (result.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else if (result.status >= 500) {
        setError(result.message || 'Erro no servidor. O banco de dados pode estar em manutenção.');
      } else {
        setError(result.message || 'Falha na autenticação. Verifique os dados e tente novamente.');
      }
    }
    setIsSubmitting(false);
  };


  return (
    <div className="flex-center" style={{ height: '100vh', background: 'linear-gradient(135deg, #0F1117 0%, #1A1F2E 100%)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#1E2433', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: '#FFFFFF', fontWeight: 800, marginBottom: '0.25rem' }}>
            Oráculo
          </h1>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#94A3B8' }}>E-mail Funcional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', outline: 'none', color: '#F1F5F9', background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#94A3B8' }}>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', outline: 'none', color: '#F1F5F9', background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Autenticando...' : 'Acessar Plataforma'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

