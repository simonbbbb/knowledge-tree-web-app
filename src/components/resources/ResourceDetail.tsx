import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  GitBranch,
  History,
  Network,
  Server,
  FileText,
  ExternalLink,
  Clock,
  Edit3,
  Plus,
  Trash2,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime, formatDate, getStatusBg, getChangeTypeColor } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  tags: string[];
  properties: Record<string, string>;
  discoveredAt: string;
  accountId?: string;
}

interface Relationship {
  id: string;
  name: string;
  type: string;
  provider: string;
  relationType: string;
  region: string;
}

interface ChangeEvent {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'deployed';
  resourceType: string;
  resourceName: string;
  description: string;
  timestamp: string;
}

const CHANGE_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5 text-success" />,
  modified: <Edit3 className="h-3.5 w-3.5 text-info" />,
  deleted: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
  deployed: <Rocket className="h-3.5 w-3.5 text-warning" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProviderBadgeClass(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'aws':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'azure':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'gcp':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'kubernetes':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'dns':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'confluence':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getTagColor(tag: string): string {
  // Generate a consistent color from the tag string
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [dependencies, setDependencies] = useState<Relationship[]>([]);
  const [dependents, setDependents] = useState<Relationship[]>([]);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          fetch(`/api/v1/resources/${encodeURIComponent(id)}`).then((r) =>
            r.ok ? r.json() : Promise.reject(r.status),
          ),
          fetch(`/api/v1/resources/${encodeURIComponent(id)}/relationships?direction=outgoing`).then((r) =>
            r.ok ? r.json() : Promise.reject(r.status),
          ),
          fetch(`/api/v1/resources/${encodeURIComponent(id)}/relationships?direction=incoming`).then((r) =>
            r.ok ? r.json() : Promise.reject(r.status),
          ),
          fetch(`/api/v1/resources/${encodeURIComponent(id)}/changes`).then((r) =>
            r.ok ? r.json() : Promise.reject(r.status),
          ),
        ]);

        if (results[0].status === 'fulfilled') {
          const raw = results[0].value;
          setResource({
            id: String(raw.id || ''),
            name: String(raw.name || ''),
            type: String(raw.type || ''),
            provider: String(raw.provider || ''),
            region: String(raw.region || ''),
            status: String(raw.status || 'unknown'),
            tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
            properties: (raw.properties as Record<string, string>) || {},
            discoveredAt: String(raw.discovered_at || raw.discoveredAt || ''),
            accountId: String(raw.account_id || raw.accountId || ''),
          });
        } else {
          setError(`Resource "${id}" not found`);
          return;
        }

        if (results[1].status === 'fulfilled') {
          const raw = results[1].value;
          const items: Relationship[] = (raw.data || raw || []).map(
            (r: Record<string, unknown>) => ({
              id: String(r.id || ''),
              name: String(r.name || ''),
              type: String(r.type || ''),
              provider: String(r.provider || ''),
              relationType: String(r.relation_type || r.relationType || 'depends_on'),
              region: String(r.region || ''),
            }),
          );
          setDependencies(items);
        }

        if (results[2].status === 'fulfilled') {
          const raw = results[2].value;
          const items: Relationship[] = (raw.data || raw || []).map(
            (r: Record<string, unknown>) => ({
              id: String(r.id || ''),
              name: String(r.name || ''),
              type: String(r.type || ''),
              provider: String(r.provider || ''),
              relationType: String(r.relation_type || r.relationType || 'depends_on'),
              region: String(r.region || ''),
            }),
          );
          setDependents(items);
        }

        if (results[3].status === 'fulfilled') {
          const raw = results[3].value;
          const items: ChangeEvent[] = (raw.data || raw || []).map(
            (c: Record<string, unknown>) => ({
              id: String(c.id || ''),
              type: String(c.type || 'modified') as ChangeEvent['type'],
              resourceType: String(c.resource_type || c.resourceType || ''),
              resourceName: String(c.resource_name || c.resourceName || ''),
              description: String(c.description || ''),
              timestamp: String(c.timestamp || ''),
            }),
          );
          setChanges(items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !resource) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/resources">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Resources
          </Link>
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <Server className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{error || 'Resource not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/resources">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Server className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{resource.name}</h1>
            <Badge className={cn('text-xs', getStatusBg(resource.status))} variant="outline">
              {resource.status}
            </Badge>
            <Badge className={cn('text-xs', getProviderBadgeClass(resource.provider))}>
              {resource.provider.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-12">
            {resource.type} {resource.region ? `in ${resource.region}` : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/graph?node=${resource.id}`}>
              <Network className="mr-1.5 h-3.5 w-3.5" />
              View in Graph
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/docs/${resource.id}`}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              View Documentation
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/reports?type=runbook&resource=${resource.id}`}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Generate Runbook
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Type', value: resource.type },
          { label: 'Provider', value: resource.provider.toUpperCase() },
          { label: 'Region', value: resource.region || 'Global' },
          {
            label: 'Relationships',
            value: `${dependencies.length + dependents.length} (${dependencies.length} out / ${dependents.length} in)`,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold truncate text-sm">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">
            <Server className="mr-1.5 h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Badge variant="outline" className="mr-1.5 h-4 w-4 text-[8px] p-0 flex items-center justify-center">
              T
            </Badge>
            Tags
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <GitBranch className="mr-1.5 h-4 w-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="changes">
            <History className="mr-1.5 h-4 w-4" />
            Changes
          </TabsTrigger>
        </TabsList>

        {/* Properties tab */}
        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resource Properties</CardTitle>
              <CardDescription>Key-value attributes of this resource</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(resource.properties).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(resource.properties).map(([key, val]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {key}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {String(val)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No properties available for this resource.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags tab */}
        <TabsContent value="tags" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
              <CardDescription>Labels attached to this resource</CardDescription>
            </CardHeader>
            <CardContent>
              {resource.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className={cn('text-xs px-3 py-1', getTagColor(tag))}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No tags attached to this resource.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships tab */}
        <TabsContent value="relationships" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Dependencies (outgoing - what this depends on) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dependencies</CardTitle>
                <CardDescription>
                  Resources that {resource.name} depends on
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Link
                            to={`/resources/${dep.id}`}
                            className="font-medium text-sm text-primary hover:underline truncate"
                          >
                            {dep.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-[10px]">
                            {dep.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {dep.relationType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No outgoing dependencies found.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dependents (incoming - what depends on this) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dependents</CardTitle>
                <CardDescription>
                  Resources that depend on {resource.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dependents.length > 0 ? (
                  <div className="space-y-2">
                    {dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Link
                            to={`/resources/${dep.id}`}
                            className="font-medium text-sm text-primary hover:underline truncate"
                          >
                            {dep.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-[10px]">
                            {dep.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {dep.relationType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No incoming dependents found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Changes tab */}
        <TabsContent value="changes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change History</CardTitle>
              <CardDescription>
                Timeline of changes to this resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changes.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-4">
                    {changes.map((change) => (
                      <div key={change.id} className="flex items-start gap-3 relative">
                        {/* Icon dot */}
                        <div className="w-[31px] h-[31px] rounded-full bg-background border flex items-center justify-center shrink-0 z-10">
                          {CHANGE_ICONS[change.type] || CHANGE_ICONS.modified}
                        </div>

                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={cn('text-[10px]', getChangeTypeColor(change.type))}
                              variant="outline"
                            >
                              {change.type}
                            </Badge>
                            <span className="text-sm font-medium">
                              {change.resourceName}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {change.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {change.timestamp
                                ? formatRelativeTime(change.timestamp)
                                : 'Unknown time'}
                            </span>
                            {change.timestamp && (
                              <>
                                <span className="text-border">|</span>
                                <span>{formatDate(change.timestamp)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No change history available for this resource.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
