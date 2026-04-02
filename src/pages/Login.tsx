import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import logoDerom from '@/assets/logo-derom.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    const ok = await login(username, password);
    setLoading(false);
    if (!ok) setError('Credenciales incorrectas');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[400px] px-6 animate-fade-in">
        {/* Logo & branding */}
        <div className="flex flex-col items-center mb-10">
          <img src={logoDerom} alt="DEROM Real Estate" width={200} height={200} className="mb-4" />
          <div className="w-12 h-px bg-primary/30 mb-3" />
          <p className="text-muted-foreground text-sm tracking-wide">Sistema de Split de Comisiones</p>
        </div>

        {/* Login card */}
        <div className="kpi-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Solicite sus credenciales al administrador del sistema
        </p>
      </div>
    </div>
  );
};

export default Login;
