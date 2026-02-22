import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();

  // Guardia: si el usuario ya está autenticado y no está cargando, redirigir al dashboard
  React.useEffect(() => {
    if (user && !authLoading) {
      window.location.href = '/';
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oat-card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="oat-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ej: demo@example.com"
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="oat-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>
        {error && <p className="oat-text--danger" style={{ marginBottom: '1rem', color: '#dc2626' }}>{error}</p>}
        <button type="submit" disabled={loading} className="oat-btn oat-btn-primary" style={{ width: '100%' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};
