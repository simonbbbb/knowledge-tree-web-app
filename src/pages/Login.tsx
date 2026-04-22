import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login() {
  const { login, loginWithApiKey } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Username/password form state.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('kt_remember_me') === 'true',
  );

  // API key form state.
  const [apiKey, setApiKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [authTab, setAuthTab] = useState<'password' | 'apikey'>('password');

  const handleRememberChange = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem('kt_remember_me', String(checked));
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      await login(username, password);
      addToast({ title: 'Welcome back!', variant: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      addToast({ title: 'Login failed', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    setLoading(true);
    try {
      await loginWithApiKey(apiKey);
      addToast({ title: 'Authenticated via API key', variant: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid API key';
      addToast({ title: 'Authentication failed', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10">
            <Network className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Knowledge Tree</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Infrastructure discovery &amp; auto-documentation
            </p>
          </div>
        </div>

        {/* Auth tabs */}
        <Tabs
          value={authTab}
          onValueChange={(v) => setAuthTab(v as 'password' | 'apikey')}
        >
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">
              Password
            </TabsTrigger>
            <TabsTrigger value="apikey" className="flex-1">
              API Key
            </TabsTrigger>
          </TabsList>

          {/* Password login */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !username || !password}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>
          </TabsContent>

          {/* API key login */}
          <TabsContent value="apikey">
            <form onSubmit={handleApiKeyLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apikey" className="text-sm font-medium">
                  API Key
                </label>
                <Input
                  id="apikey"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Use the API key configured on the server for programmatic access.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !apiKey}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Authenticate
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Default credentials: <code className="bg-muted px-1.5 py-0.5 rounded">admin</code> / <code className="bg-muted px-1.5 py-0.5 rounded">admin</code>
        </p>
      </div>
    </div>
  );
}
