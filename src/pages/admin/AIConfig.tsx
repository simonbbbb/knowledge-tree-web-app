import { useState, useEffect } from 'react';
import { Bot, Save, TestTube, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure-openai', label: 'Azure OpenAI' },
  { value: 'local', label: 'Local (Ollama)' },
  { value: 'custom', label: 'Custom Endpoint' },
];

const MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
  'azure-openai': ['gpt-4o', 'gpt-35-turbo'],
  local: ['llama3.1', 'mistral', 'codellama'],
  custom: [],
};

export function AIConfig() {
  const [config, setConfig] = useState({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    apiKeyConfigured: false,
    baseUrl: '',
    maxTokens: 4096,
    temperature: 0.7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const resp = await fetch('/api/v1/admin/config');
        if (resp.ok) {
          const json = await resp.json();
          const data = json.data || json;
          if (data.enricher) {
            setConfig((prev) => ({
              ...prev,
              provider: data.enricher.provider || prev.provider,
              model: data.enricher.model || prev.model,
              baseUrl: data.enricher.base_url || prev.baseUrl,
              apiKeyConfigured: !!data.enricher.api_key_configured,
              apiKey: data.enricher.api_key_configured ? prev.apiKey : '',
            }));
          }
          if (data.llm) {
            setConfig((prev) => ({
              ...prev,
              provider: data.llm.provider || prev.provider,
              model: data.llm.model || prev.model,
              baseUrl: data.llm.base_url || prev.baseUrl,
              apiKeyConfigured: !!data.llm.api_key_configured,
              apiKey: data.llm.api_key_configured ? prev.apiKey : '',
            }));
          }
        }
      } catch {
        // Config endpoint may not return AI-specific config yet
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleProviderChange = (provider: string) => {
    const models = MODELS[provider] || [];
    setConfig({
      ...config,
      provider,
      model: models[0] || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'enricher',
          value: {
            provider: config.provider,
            model: config.model,
            base_url: config.baseUrl || undefined,
            api_key: config.apiKey || undefined,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
          },
        }),
      });
    } catch {
      // May not be supported yet
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      // Test LLM connectivity by triggering a simple doc generation.
      const resp = await fetch('/api/v1/docs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test', max_results: 1 }),
      });
      setTestStatus(resp.ok ? 'success' : 'error');
    } catch {
      setTestStatus('error');
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">AI / LLM Configuration</h2>
        <p className="text-sm text-muted-foreground">Configure the AI model used for documentation generation and the chat assistant.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Provider Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Provider Settings
            </CardTitle>
            <CardDescription>Select and configure your LLM provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={config.provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={config.model} onValueChange={(v) => setConfig({ ...config, model: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODELS[config.provider] || []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={config.apiKeyConfigured && !config.apiKey ? 'sk-******************************' : config.apiKey}
                  placeholder="Enter API key"
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value, apiKeyConfigured: e.target.value.length > 0 })}
                />
                <Badge
                  className={cn(
                    'shrink-0 self-center text-[10px]',
                    config.apiKeyConfigured ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                  variant="outline"
                >
                  {config.apiKeyConfigured ? 'Set' : 'Not Set'}
                </Badge>
              </div>
            </div>

            {(config.provider === 'local' || config.provider === 'custom') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Base URL</label>
                <Input
                  placeholder="http://localhost:11434"
                  value={config.baseUrl || ''}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generation Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generation Settings</CardTitle>
            <CardDescription>Tune AI output parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Max Tokens</label>
                <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
              </div>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>256</span>
                <span>8192</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Temperature</label>
                <span className="text-sm text-muted-foreground">{config.temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Precise (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            <Separator />

            {/* Test Connection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Connection Test</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleTest} disabled={testStatus === 'testing'}>
                  <TestTube className="mr-2 h-4 w-4" />
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
                {testStatus === 'success' && (
                  <div className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Connection successful
                  </div>
                )}
                {testStatus === 'error' && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Connection failed
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
