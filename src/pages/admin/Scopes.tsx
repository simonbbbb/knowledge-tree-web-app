import { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Trash2,
  Settings,
  Cloud,
  Server,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime } from '@/lib/utils';

interface Scope {
  id: string;
  name: string;
  plugin_name: string;
  config: Record<string, unknown>;
  status: string;
  last_run?: string;
  resource_count?: number;
  schedule?: string;
}

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  aws: <Cloud className="h-5 w-5 text-orange-500" />,
  gcp: <Cloud className="h-5 w-5 text-blue-500" />,
  azure: <Cloud className="h-5 w-5 text-blue-600" />,
  kubernetes: <Server className="h-5 w-5 text-primary" />,
};

export function Scopes() {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeType, setNewScopeType] = useState('kubernetes');
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetchScopes();
  }, []);

  async function fetchScopes() {
    setLoading(true);
    try {
      const resp = await fetch('/api/v1/discovery/scopes');
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const json = await resp.json();
      setScopes(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error('Failed to fetch scopes:', err);
      setScopes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const resp = await fetch('/api/v1/discovery/scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScopeName,
          plugin_name: newScopeType,
          config: {},
          schedule: '0 */6 * * *',
        }),
      });
      if (resp.ok) {
        setShowCreateDialog(false);
        setNewScopeName('');
        fetchScopes();
      }
    } catch (err) {
      console.error('Failed to create scope:', err);
    }
  }

  async function handleRun(scopeId: string) {
    setRunning(scopeId);
    try {
      await fetch('/api/v1/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope_id: scopeId }),
      });
    } catch (err) {
      console.error('Failed to run discovery:', err);
    } finally {
      setRunning(null);
    }
  }

  async function handleDelete(scopeId: string) {
    if (!confirm('Delete this discovery scope?')) return;
    try {
      const resp = await fetch(`/api/v1/discovery/scopes/${scopeId}`, { method: 'DELETE' });
      if (resp.ok) {
        setScopes((prev) => prev.filter((s) => s.id !== scopeId));
      }
    } catch (err) {
      console.error('Failed to delete scope:', err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Discovery Scopes</h2>
          <p className="text-sm text-muted-foreground">Configure where Knowledge Tree discovers your infrastructure.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Scope
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : scopes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No discovery scopes configured.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a scope to start discovering infrastructure.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scopes.map((scope) => (
            <Card key={scope.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {SCOPE_ICONS[scope.plugin_name] || <Cloud className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{scope.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {scope.plugin_name}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            scope.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                          )}
                          variant="outline"
                        >
                          {scope.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {scope.resource_count ?? 0} resources
                        {scope.last_run && ` - Last run ${formatRelativeTime(scope.last_run)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRun(scope.id)}
                      disabled={running === scope.id}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {running === scope.id ? 'Running...' : 'Run'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(scope.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discovery Scope</DialogTitle>
            <DialogDescription>
              Configure a new source for infrastructure discovery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., AWS Production"
                value={newScopeName}
                onChange={(e) => setNewScopeName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={newScopeType} onValueChange={setNewScopeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kubernetes">Kubernetes</SelectItem>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="gcp">Google Cloud</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newScopeName.trim()}>
              Create Scope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
