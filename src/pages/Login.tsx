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

    const success = await login(email, password);
    if (success) {
      // We need to check the updated state, but since we're in the same cycle, 
      // we might want a small delay or a more direct way. 
      // Actually, AuthContext updates state and we can just navigate.
      // But to be sure we get the LATEST isAdmin, we could check the localStorage or just trust the next cycle.
      // In React, state updates are batched. 
      // Let's use a trick or just trust the redirection in App.tsx if we had one.
      // Better: navigate to / first, and let App.tsx or Dashboard handle it? 
      // No, let's just use the current isAdmin from context if it's available after login.
      
      // Let's modify login to return the flag for easier usage here.
      window.location.href = '/'; // Simple way to force refresh and context load
    } else {
      setError('Credenciais inválidas.');
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
