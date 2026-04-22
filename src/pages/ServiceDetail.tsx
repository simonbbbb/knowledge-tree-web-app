import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  GitBranch,
  Shield,
  Activity,
  FileText,
  ServerIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import { cn, getStatusBg } from '@/lib/utils';

interface ServiceResource {
  id: string;
  name: string;
  type: string;
  namespace?: string;
  provider?: string;
  image?: string;
  replicas?: string;
  cluster_ip?: string;
  phase?: string;
  [key: string]: unknown;
}

interface RunbookSection {
  title: string;
  content: string;
  items?: string[];
}

interface Dependency {
  id?: string;
  name?: string;
  type?: string;
  source?: string;
  target?: string;
  edge_type?: string;
  [key: string]: unknown;
}

export function ServiceDetail() {
  const { name = '' } = useParams<{ name: string }>();
  const [service, setService] = useState<ServiceResource | null>(null);
  const [runbook, setRunbook] = useState<RunbookSection[] | null>(null);
  const [deps, setDeps] = useState<{ dependencies: Dependency[]; edges: Dependency[] } | null>(null);
  const [impact, setImpact] = useState<{ impacted: Dependency[]; total: number } | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          fetch(`/api/v1/services/${encodeURIComponent(name)}`).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(`/api/v1/services/${encodeURIComponent(name)}/runbook`).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(`/api/v1/services/${encodeURIComponent(name)}/dependencies`).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(`/api/v1/services/${encodeURIComponent(name)}/impact`).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(`/api/v1/docs/${encodeURIComponent(name)}`).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
        ]);

        if (results[0].status === 'fulfilled') {
          setService(results[0].value);
        } else {
          setError(`Service "${name}" not found`);
          return;
        }

        if (results[1].status === 'fulfilled') {
          const rb = results[1].value;
          setRunbook(rb.sections || []);
        }

        if (results[2].status === 'fulfilled') {
          setDeps(results[2].value);
        }

        if (results[3].status === 'fulfilled') {
          setImpact(results[3].value);
        }

        if (results[4].status === 'fulfilled') {
          setDocContent(results[4].value.content || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [name]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/services"><ArrowLeft className="mr-1 h-4 w-4" />Back to Services</Link>
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{error || 'Service not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derive upstream/downstream from deps
  const upstream = (deps?.edges || []).filter((e) => e.target === service.id || e.target === service.name);
  const downstream = (deps?.edges || []).filter((e) => e.source === service.id || e.source === service.name);

  // Build runbook markdown
  const runbookMd = runbook
    ? runbook.map((s) => `## ${s.title}\n\n${s.content}${s.items?.length ? '\n\n' + s.items.map((i) => `- ${i}`).join('\n') : ''}`).join('\n\n')
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/services">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Server className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
            <Badge className={cn('ml-2', getStatusBg('healthy'))} variant="outline">
              {service.phase || 'healthy'}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-12">
            {service.type} in {service.namespace || 'default'}
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Type', value: service.type?.replace('k8s.', '') || '-' },
          { label: 'Namespace', value: service.namespace || '-' },
          { label: 'Provider', value: service.provider || '-' },
          { label: 'Upstream / Downstream', value: `${upstream.length} / ${downstream.length}` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties from metadata */}
      {service.image && (
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">Image: {service.image}</Badge>
          {service.replicas && <Badge variant="secondary" className="text-xs">Replicas: {service.replicas}</Badge>}
          {service.cluster_ip && <Badge variant="secondary" className="text-xs">Cluster IP: {service.cluster_ip}</Badge>}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="mr-1 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="infrastructure">
            <ServerIcon className="mr-1 h-4 w-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <GitBranch className="mr-1 h-4 w-4" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="runbook">
            <Shield className="mr-1 h-4 w-4" />
            Runbook
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <FileText className="mr-1 h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(service)
                  .filter(([k, v]) => !['_raw', 'id'].includes(k) && v != null && String(v) !== '')
                  .map(([key, val]) => (
                    <div key={key} className="flex justify-between min-w-0">
                      <span className="text-muted-foreground truncate mr-2">{key}</span>
                      <span className="truncate text-right max-w-[60%]">{String(val)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {impact ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {impact.total} resources depend on this service
                    </p>
                    {impact.impacted?.slice(0, 5).map((imp, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                        <Server className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm truncate">{imp.name || imp.id || `resource-${i}`}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{imp.type || ''}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No impact data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Resources</CardTitle>
              <CardDescription>Resources linked to this service</CardDescription>
            </CardHeader>
            <CardContent>
              {deps?.dependencies && deps.dependencies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deps.dependencies.map((dep, i) => (
                      <TableRow key={dep.id || i}>
                        <TableCell className="font-mono text-sm">{dep.name || dep.id}</TableCell>
                        <TableCell>{dep.type || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No related infrastructure resources found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upstream (Callers)</CardTitle>
                <CardDescription>Services that call {service.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {upstream.length > 0 ? (
                  <div className="space-y-2">
                    {upstream.map((dep, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <a href={`/services/${dep.source}`} className="font-medium text-sm text-primary hover:underline">
                            {dep.source}
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground">{dep.edge_type || dep.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upstream dependencies found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Downstream (Dependencies)</CardTitle>
                <CardDescription>Services that {service.name} depends on</CardDescription>
              </CardHeader>
              <CardContent>
                {downstream.length > 0 ? (
                  <div className="space-y-2">
                    {downstream.map((dep, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <a href={`/services/${dep.target}`} className="font-medium text-sm text-primary hover:underline">
                            {dep.target}
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground">{dep.edge_type || dep.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No downstream dependencies found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="runbook" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {runbookMd ? (
                <MarkdownRenderer content={runbookMd} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No runbook available. Generate documentation from the Reports page.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {docContent ? (
                <MarkdownRenderer content={docContent} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No documentation available. Generate docs from the Reports page.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
