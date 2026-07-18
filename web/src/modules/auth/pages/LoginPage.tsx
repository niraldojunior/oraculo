import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button.js';
import Input from '@/components/common/Input.js';

const LoginPage: React.FC = () => {
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
      navigate('/');
    } else {
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
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-logo">Oráculo</div>

        <div className="login-card">
          {error && <div className="login-error" role="alert">{error}</div>}

          <form onSubmit={handleLogin} className="form-container gap-4">
          <Input
            label="E-mail Funcional"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Autenticando...' : 'Acessar Plataforma'}
          </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

