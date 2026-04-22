import { useState, useEffect } from 'react';
import {
  Server,
  GitBranch,
  Database,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalResources: number;
  totalRelations: number;
  totalServices: number;
  namespaces: string[];
  resourceTypes: Record<string, number>;
}

interface DiscoveredChange {
  id: string;
  type: string;
  resourceType: string;
  resourceName: string;
  scope: string;
  description: string;
  impact: string;
  timestamp: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ChangeRow({ change }: { change: DiscoveredChange }) {
  const typeColors: Record<string, string> = {
    created: 'bg-success/10 text-success',
    modified: 'bg-info/10 text-info',
    deleted: 'bg-destructive/10 text-destructive',
    deployed: 'bg-warning/10 text-warning',
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <Badge className={cn('mt-0.5 text-[10px]', typeColors[change.type] || 'bg-info/10 text-info')} variant="outline">
        {change.type}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{change.resourceName}</span>
          <span className="text-muted-foreground"> - {change.description}</span>
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{change.resourceType}</span>
          <span>|</span>
          <span>{change.scope}</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [changes, setChanges] = useState<DiscoveredChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch graph export to count resources and relationships
        const exportResp = await fetch('/api/v1/graph/export?format=json');
        let totalResources = 0;
        let totalRelations = 0;
        let resourceTypes: Record<string, number> = {};
        let namespaces = new Set<string>();

        if (exportResp.ok) {
          const exportData = await exportResp.json();
          const nodes = exportData.nodes || [];
          const edges = exportData.edges || [];
          totalResources = nodes.length;
          totalRelations = edges.length;

          nodes.forEach((n: Record<string, unknown>) => {
            const t = String(n.type || 'unknown');
            resourceTypes[t] = (resourceTypes[t] || 0) + 1;
            const ns = String(n.namespace || '');
            if (ns) namespaces.add(ns);
          });
        }

        // Count services (deployments + services)
        const svcResp = await fetch('/api/v1/services/');
        let totalServices = 0;
        if (svcResp.ok) {
          const svcData = await svcResp.json();
          totalServices = (svcData.data || []).length;
        }

        setStats({
          totalResources,
          totalRelations,
          totalServices,
          namespaces: Array.from(namespaces),
          resourceTypes,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchChanges() {
      try {
        const resp = await fetch('/api/v1/changes/');
        if (resp.ok) {
          const json = await resp.json();
          setChanges((json.data || []).slice(0, 5));
        }
      } catch {
        // Changes endpoint may return empty, that's fine
      }
    }

    fetchData();
    fetchChanges();
  }, []);

  // Build chart data from resource types
  const resourceChartData = stats
    ? Object.entries(stats.resourceTypes)
        .map(([type, count]) => ({
          type: type.replace('k8s.', ''),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your infrastructure knowledge graph.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resources"
          value={loading ? '...' : (stats?.totalResources ?? 0)}
          description="discovered resources"
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Relationships"
          value={loading ? '...' : (stats?.totalRelations ?? 0)}
          description="mapped connections"
          icon={<GitBranch className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Services"
          value={loading ? '...' : (stats?.totalServices ?? 0)}
          description="discovered services & deployments"
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Namespaces"
          value={loading ? '...' : (stats?.namespaces.length ?? 0)}
          description="Kubernetes namespaces"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resource Types */}
        <Card>
          <CardHeader>
            <CardTitle>Resources by Type</CardTitle>
            <CardDescription>Breakdown of discovered resource types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resourceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="type" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="count" name="Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Namespaces */}
        <Card>
          <CardHeader>
            <CardTitle>Discovered Namespaces</CardTitle>
            <CardDescription>Kubernetes namespaces with discovered resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats?.namespaces.map((ns) => (
                <Badge key={ns} variant="secondary" className="text-sm py-1 px-3">
                  {ns}
                </Badge>
              )) || <p className="text-sm text-muted-foreground">Loading...</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Changes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Changes</CardTitle>
              <CardDescription>Latest infrastructure changes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/changes">View all</a>
            </Button>
          </CardHeader>
          <CardContent>
            {changes.length > 0 ? (
              <div className="divide-y">
                {changes.map((change) => (
                  <ChangeRow key={change.id} change={change} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Run discovery to see infrastructure changes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Discovery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Discovery Source</CardTitle>
            <CardDescription>Current data source information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">Kubernetes (kind-kt-test)</p>
                  <p className="text-xs text-muted-foreground">Local kind cluster discovery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">In-Memory Storage</p>
                  <p className="text-xs text-muted-foreground">Backend: memory</p>
                </div>
              </div>
              {stats && (
                <div className="mt-4 p-3 rounded-md bg-muted">
                  <p className="text-xs text-muted-foreground">
                    {stats.totalResources} resources across {stats.namespaces.length} namespaces
                    with {stats.totalRelations} relationships
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
