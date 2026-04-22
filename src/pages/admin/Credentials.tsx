import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, TestTube, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Credential {
  id: string;
  name: string;
  type: string;
  scope: string;
  status: string;
  created_at: string;
  last_used?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

const CRED_TYPES = [
  { value: 'aws', label: 'AWS', fields: ['access_key_id', 'secret_access_key', 'region'] },
  { value: 'gcp', label: 'GCP', fields: ['credentials_json'] },
  { value: 'azure', label: 'Azure', fields: ['tenant_id', 'client_id', 'client_secret', 'subscription_id'] },
  { value: 'kubernetes', label: 'Kubernetes', fields: ['kubeconfig'] },
  { value: 'custom', label: 'Custom', fields: ['key', 'value'] },
];

export function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCred, setNewCred] = useState({ name: '', type: 'aws', description: '', secret: {} as Record<string, string> });
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      const resp = await fetch('/api/v1/admin/credentials');
      if (resp.ok) {
        const json = await resp.json();
        setCredentials(Array.isArray(json) ? json : json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const resp = await fetch('/api/v1/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCred.name,
          type: newCred.type,
          description: newCred.description,
          secret: newCred.secret,
        }),
      });
      if (resp.ok) {
        setDialogOpen(false);
        setNewCred({ name: '', type: 'aws', description: '', secret: {} });
        fetchCredentials();
      }
    } catch (err) {
      console.error('Failed to create credential:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this credential?')) return;
    try {
      await fetch(`/api/v1/admin/credentials/${id}`, { method: 'DELETE' });
      fetchCredentials();
    } catch (err) {
      console.error('Failed to delete credential:', err);
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const resp = await fetch(`/api/v1/admin/credentials/${id}/test`, { method: 'POST' });
      if (resp.ok) {
        fetchCredentials();
      }
    } catch (err) {
      console.error('Failed to test credential:', err);
    } finally {
      setTesting(null);
    }
  }

  const selectedType = CRED_TYPES.find((t) => t.value === newCred.type);

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Credentials</h2>
          <p className="text-sm text-muted-foreground">Manage API keys and access credentials for discovery sources.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Credential
        </Button>
      </div>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No credentials configured</h3>
            <p className="text-sm text-muted-foreground">
              Add cloud provider credentials to enable infrastructure discovery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred) => (
            <Card key={cred.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{cred.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground uppercase">{cred.type}</p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px]',
                      cred.status === 'valid' ? 'bg-success/10 text-success' :
                      cred.status === 'invalid' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    {cred.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {cred.description && (
                  <p className="text-xs text-muted-foreground mb-3">{cred.description}</p>
                )}
                {cred.metadata?.key_hint ? (
                  <p className="text-xs text-muted-foreground mb-3 font-mono">
                    Key: ...{String(cred.metadata.key_hint)}
                  </p>
                ) : null}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={testing === cred.id}
                    onClick={() => handleTest(cred.id)}
                  >
                    <TestTube className="mr-1 h-3 w-3" />
                    {testing === cred.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => handleDelete(cred.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Production AWS"
                value={newCred.name}
                onChange={(e) => setNewCred({ ...newCred, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={newCred.type} onValueChange={(v) => setNewCred({ ...newCred, type: v, secret: {} })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRED_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={newCred.description}
                onChange={(e) => setNewCred({ ...newCred, description: e.target.value })}
              />
            </div>

            {selectedType?.fields.map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                <Input
                  type={field.includes('secret') || field.includes('key') || field.includes('json') ? 'password' : 'text'}
                  placeholder={field}
                  value={newCred.secret[field] || ''}
                  onChange={(e) => setNewCred({ ...newCred, secret: { ...newCred.secret, [field]: e.target.value } })}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newCred.name || Object.values(newCred.secret).every((v) => !v)} >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
