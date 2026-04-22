import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Rocket,
  Filter,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime, formatDate, getChangeTypeColor } from '@/lib/utils';
import type { Change } from '@/lib/api';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-4 w-4 text-success" />,
  modified: <Edit3 className="h-4 w-4 text-info" />,
  deleted: <Trash2 className="h-4 w-4 text-destructive" />,
  deployed: <Rocket className="h-4 w-4 text-warning" />,
};

function groupChangesByDate(changes: Change[]): Map<string, Change[]> {
  const groups = new Map<string, Change[]>();
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  for (const change of changes) {
    const date = new Date(change.timestamp);
    let label: string;
    if (date.toDateString() === todayStr) {
      label = 'Today';
    } else if (date.toDateString() === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = formatDate(change.timestamp);
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(change);
  }

  return groups;
}

export function ChangeFeed() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    async function fetchChanges() {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (scopeFilter !== 'all') params.set('scope', scopeFilter);
        if (dateFilter) params.set('since', dateFilter);
        const qs = params.toString();
        const resp = await fetch(`/api/v1/changes/${qs ? '?' + qs : ''}`);
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        let data: Change[] = json.data || json || [];
        // Client-side date filtering since the API may not support `since` param.
        if (dateFilter) {
          const since = new Date(dateFilter);
          data = data.filter((c) => new Date(c.timestamp) >= since);
        }
        setChanges(data);
      } catch (err) {
        console.error('Failed to fetch changes:', err);
        setChanges([]);
      } finally {
        setLoading(false);
      }
    }
    fetchChanges();
  }, [typeFilter, scopeFilter, dateFilter]);

  const grouped = groupChangesByDate(changes);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Change Feed</h1>
        <p className="text-muted-foreground">
          Timeline of all infrastructure changes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Change Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="modified">Modified</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="default">Default</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            className="pl-8"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <Button variant="outline" size="sm" className="ml-auto">
          {changes.length} changes
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : changes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No changes recorded yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run discovery to start tracking infrastructure changes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateLabel, dateChanges]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                {dateLabel}
              </h3>
              <div className="space-y-2">
                {dateChanges.map((change) => (
                  <Card key={change.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {TYPE_ICONS[change.type] || TYPE_ICONS.created}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={cn('text-[10px]', getChangeTypeColor(change.type))}
                              variant="outline"
                            >
                              {change.type}
                            </Badge>
                            <span className="text-sm font-medium">{change.resourceName}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {change.resourceType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {change.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{change.scope}</span>
                            <span>|</span>
                            <span>{formatRelativeTime(change.timestamp)}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] shrink-0',
                            change.impact === 'high'
                              ? 'border-destructive/30 text-destructive'
                              : change.impact === 'medium'
                                ? 'border-warning/30 text-warning'
                                : 'border-border text-muted-foreground',
                          )}
                        >
                          {change.impact} impact
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
