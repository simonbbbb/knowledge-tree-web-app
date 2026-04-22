import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, User as UserIcon, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const PERMISSIONS = {
  admin: ['Full system access', 'Manage users', 'Configure integrations', 'Manage scopes', 'Run discoveries'],
  editor: ['View all resources', 'Edit documentation', 'Run discoveries', 'Generate reports'],
  viewer: ['View all resources', 'View documentation', 'View reports'],
};

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: string;
  active: boolean;
  created_at: string;
  last_login: string;
}

const API_BASE = '/api/v1';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', display_name: '', password: '', role: 'viewer' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // Use empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setCreateOpen(false);
        setForm({ username: '', email: '', display_name: '', password: '', role: 'viewer' });
        fetchUsers();
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Users & RBAC</h2>
          <p className="text-sm text-muted-foreground">Manage user access and role-based permissions.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input placeholder="Display Name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={handleCreate} className="w-full" disabled={!form.username || !form.password}>Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.display_name || user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email || user.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      user.role === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {user.role}
                    </span>
                    {!user.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">inactive</span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        {(['admin', 'editor', 'viewer'] as const).map((role) => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {PERMISSIONS[role].map((perm) => (
                  <li key={perm} className="text-xs text-muted-foreground">
                    - {perm}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Login endpoint: <code className="bg-muted px-1 rounded">POST /api/v1/auth/login</code>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Default credentials: <code className="bg-muted px-1 rounded">admin / admin</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
