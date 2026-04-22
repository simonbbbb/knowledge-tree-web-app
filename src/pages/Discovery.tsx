import { useState } from 'react';
import {
  Plus,
  Play,
  PlayCircle,
  Pause,
  ChevronDown,
  ChevronRight,
  Cloud,
  Server,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  cn,
  formatRelativeTime,
  formatDateTime,
  formatDuration,
  getStatusBg,
} from '@/lib/utils';
import {
  useDiscoveryScopes,
  useDiscoveryRuns,
  useStartDiscovery,
  useCreateScope,
  useToggleScope,
  useStartAllDiscovery,
} from '@/hooks/useDiscovery';
import type { DiscoveryScope, DiscoveryRun } from '@/lib/api';

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  aws: <Cloud className="h-5 w-5 text-orange-500" />,
  gcp: <Cloud className="h-5 w-5 text-blue-500" />,
  azure: <Cloud className="h-5 w-5 text-blue-600" />,
  kubernetes: <Server className="h-5 w-5 text-primary" />,
  github: <Server className="h-5 w-5 text-gray-600" />,
};

const RUN_STATUS_ICONS: Record<DiscoveryRun['status'], React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  running: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
};

function getRunDuration(run: DiscoveryRun): number | null {
  if (!run.startedAt) return null;
  const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
  return end - new Date(run.startedAt).getTime();
}

function NewScopeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [pluginName, setPluginName] = useState<string>('kubernetes');
  const [schedule, setSchedule] = useState('0 */6 * * *');
  const [configJson, setConfigJson] = useState('{}');
  const [configError, setConfigError] = useState('');
  const createScope = useCreateScope();

  function resetForm() {
    setName('');
    setPluginName('kubernetes');
    setSchedule('0 */6 * * *');
    setConfigJson('{}');
    setConfigError('');
  }

  function handleCreate() {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(configJson);
    } catch {
      setConfigError('Invalid JSON');
      return;
    }
    setConfigError('');

    createScope.mutate(
      {
        name,
        type: pluginName as DiscoveryScope['type'],
        config: parsed,
        enabled: true,
        schedule,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Discovery Scope</DialogTitle>
          <DialogDescription>
            Configure a new source for infrastructure discovery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., AWS Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plugin</label>
            <Select value={pluginName} onValueChange={setPluginName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kubernetes">Kubernetes</SelectItem>
                <SelectItem value="aws">AWS</SelectItem>
                <SelectItem value="gcp">Google Cloud</SelectItem>
                <SelectItem value="azure">Azure</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule (cron)</label>
            <Input
              placeholder="0 */6 * * *"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cron expression for automated discovery runs. Default: every 6 hours.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Config (JSON)</label>
            <textarea
              className={cn(
                'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono',
                configError && 'border-destructive',
              )}
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value);
                setConfigError('');
              }}
              placeholder='{"region": "us-east-1"}'
            />
            {configError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {configError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createScope.isPending}
          >
            {createScope.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Scope
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScopeCard({
  scope,
  runs,
}: {
  scope: DiscoveryScope;
  runs: DiscoveryRun[];
}) {
  const [expanded, setExpanded] = useState(false);
  const startDiscovery = useStartDiscovery();
  const toggleScope = useToggleScope();

  const scopeRuns = runs
    .filter((r) => r.scope === scope.id)
    .slice(0, 5);

  const activeRun = scopeRuns.find((r) => r.status === 'running' || r.status === 'pending');
  const isRunning = !!activeRun;

  function handleRun() {
    if (!window.confirm(`Run discovery for "${scope.name}"?`)) return;
    startDiscovery.mutate(scope.id);
  }

  function handleToggle() {
    toggleScope.mutate({ id: scope.id, enabled: !scope.enabled });
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Main row */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                {SCOPE_ICONS[scope.type] || <Cloud className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{scope.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {scope.type}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-[10px] shrink-0',
                      scope.enabled
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    {scope.enabled ? 'active' : 'paused'}
                  </Badge>
                  {isRunning && (
                    <Badge className="text-[10px] shrink-0 bg-info/10 text-info" variant="outline">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      running
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {scope.resourceCount ?? 0} resources
                  {scope.lastRun && ` \u00b7 Last run ${formatRelativeTime(scope.lastRun)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Play className="mr-1 h-3 w-3" />
                )}
                Run
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                disabled={toggleScope.isPending}
              >
                {scope.enabled ? (
                  <>
                    <Pause className="mr-1 h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1 h-3 w-3" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
            {/* Config */}
            <div>
              <h4 className="text-sm font-medium mb-2">Configuration</h4>
              <pre className="text-xs bg-background rounded-md p-3 overflow-auto max-h-40 font-mono border">
                {JSON.stringify(scope.config, null, 2)}
              </pre>
            </div>

            {/* Recent runs */}
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Runs</h4>
              {scopeRuns.length === 0 ? (
                <p className="text-xs text-muted-foreground">No runs recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead>Resources</TableHead>
                      <TableHead>Relations</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopeRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {RUN_STATUS_ICONS[run.status]}
                            <span className="capitalize text-xs">{run.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{run.resourcesFound}</TableCell>
                        <TableCell className="text-xs">{run.relationsFound}</TableCell>
                        <TableCell className="text-xs">
                          {getRunDuration(run) !== null
                            ? formatDuration(getRunDuration(run)!)
                            : '--'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(run.startedAt)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {run.completedAt ? formatDateTime(run.completedAt) : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Discovery() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: scopes = [], isLoading: scopesLoading } = useDiscoveryScopes();
  const { data: runs = [], isLoading: runsLoading } = useDiscoveryRuns();
  const startAll = useStartAllDiscovery();

  const isLoading = scopesLoading || runsLoading;

  function handleRunAll() {
    if (!window.confirm('Run discovery for all active scopes?')) return;
    startAll.mutate(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discovery</h1>
          <p className="text-muted-foreground">
            Manage discovery scopes and run infrastructure scans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRunAll}
            disabled={startAll.isPending || scopes.length === 0}
          >
            {startAll.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Run All
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Scope
          </Button>
        </div>
      </div>

      {/* Scope list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scopes</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : scopes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No discovery scopes configured.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a scope to start discovering infrastructure.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scopes.map((scope) => (
              <ScopeCard key={scope.id} scope={scope} runs={runs} />
            ))}
          </div>
        )}
      </div>

      {/* Runs history */}
      {!isLoading && runs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Discovery Run History</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Relations</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    {runs.some((r) => r.errors.length > 0) && (
                      <TableHead className="w-[80px]">Errors</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => {
                    const scope = scopes.find((s) => s.id === run.scope);
                    return (
                      <TableRow key={run.id}>
                        <TableCell>
                          <Badge
                            className={cn('text-[10px]', getStatusBg(run.status))}
                            variant="outline"
                          >
                            <span className="mr-1 inline-flex align-middle">
                              {RUN_STATUS_ICONS[run.status]}
                            </span>
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {scope?.name ?? run.scope}
                        </TableCell>
                        <TableCell className="text-sm">{run.resourcesFound}</TableCell>
                        <TableCell className="text-sm">{run.relationsFound}</TableCell>
                        <TableCell className="text-sm">
                          {getRunDuration(run) !== null
                            ? formatDuration(getRunDuration(run)!)
                            : '--'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(run.startedAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {run.completedAt ? formatDateTime(run.completedAt) : '--'}
                        </TableCell>
                        {runs.some((r) => r.errors.length > 0) && (
                          <TableCell>
                            {run.errors.length > 0 ? (
                              <Badge variant="destructive" className="text-[10px]">
                                {run.errors.length}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Scope Dialog */}
      <NewScopeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
