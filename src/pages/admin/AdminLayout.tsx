import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Target, Puzzle, Key, Users, Bot } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ADMIN_TABS = [
  { value: '/admin/scopes', label: 'Scopes', icon: <Target className="h-4 w-4" /> },
  { value: '/admin/plugins', label: 'Plugins', icon: <Puzzle className="h-4 w-4" /> },
  { value: '/admin/credentials', label: 'Credentials', icon: <Key className="h-4 w-4" /> },
  { value: '/admin/users', label: 'Users & RBAC', icon: <Users className="h-4 w-4" /> },
  { value: '/admin/ai', label: 'AI Config', icon: <Bot className="h-4 w-4" /> },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        </div>
        <p className="text-muted-foreground">Manage discovery scopes, plugins, credentials, and system configuration.</p>
      </div>

      <Tabs value={location.pathname} onValueChange={(v) => navigate(v)}>
        <TabsList>
          {ADMIN_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
