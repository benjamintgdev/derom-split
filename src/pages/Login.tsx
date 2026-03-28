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
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logoDerom} alt="DEROM Real Estate" width={180} height={180} className="mb-6" />
          <p className="text-muted-foreground text-sm">Sistema de Split de Comisiones</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-8 p-4 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Usuarios demo:</p>
          <p>CEO: ceo@derom.com / admin123</p>
          <p>Contable: contable@derom.com / contable123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
