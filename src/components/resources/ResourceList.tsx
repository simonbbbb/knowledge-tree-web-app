import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Server,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatRelativeTime, getStatusBg } from '@/lib/utils';
import { ResourceFilter, type ResourceFilterState } from './ResourceFilter';
import { ResourceSearch } from './ResourceSearch';
import { ResourceCard } from './ResourceCard';

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
  relationshipCount: number;
}

interface ResourceListResponse {
  data: Resource[];
  total: number;
  cursor: string | null;
  has_more: boolean;
}

type SortField = 'name' | 'type' | 'provider' | 'region' | 'status' | 'discoveredAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDirection }: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (field !== sortField) {
    return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
  }
  return sortDirection === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
}

// ─── Provider color helper ────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceList() {
  const navigate = useNavigate();

  // Data state
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Pagination state (cursor-based)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 25;

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ResourceFilterState>({
    providers: [],
    type: '',
    region: '',
    scope: '',
  });

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      if (currentCursor) params.set('cursor', currentCursor);
      if (searchQuery) params.set('search', searchQuery);
      if (filters.type) params.set('type', filters.type);
      if (filters.region) params.set('region', filters.region);
      if (filters.scope) params.set('scope', filters.scope);
      if (filters.providers.length > 0) params.set('provider', filters.providers.join(','));

      const qs = params.toString();
      const resp = await fetch(`/api/v1/resources/${qs ? '?' + qs : ''}`);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const json: ResourceListResponse = await resp.json();

      const items = json.data || [];
      setResources(items.map((r: Resource) => ({
        id: String(r.id || ''),
        name: String(r.name || ''),
        type: String(r.type || ''),
        provider: String(r.provider || ''),
        region: String(r.region || ''),
        status: String(r.status || 'unknown'),
        tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
        properties: (r.properties as Record<string, string>) || {},
        discoveredAt: String(r.discoveredAt || ''),
        relationshipCount: Number(r.relationshipCount || 0),
      })));
      setTotal(json.total || items.length);
      setHasMore(json.has_more || false);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [currentCursor, searchQuery, filters]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentCursor(null);
    setCursorStack([null]);
  }, [searchQuery, filters]);

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    setSortDirection((prev) =>
      sortField === field && prev === 'asc' ? 'desc' : 'asc',
    );
    setSortField(field);
  }, [sortField]);

  // Client-side sort on loaded data
  const sortedResources = useMemo(() => {
    const sorted = [...resources];
    sorted.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [resources, sortField, sortDirection]);

  // Pagination handlers
  const goNext = useCallback(() => {
    if (hasMore && resources.length > 0) {
      const newCursor = resources[resources.length - 1].id;
      setCursorStack((prev) => [...prev, currentCursor]);
      setCurrentCursor(newCursor);
    }
  }, [hasMore, resources, currentCursor]);

  const goPrev = useCallback(() => {
    if (cursorStack.length > 1) {
      const newStack = cursorStack.slice(0, -1);
      setCursorStack(newStack);
      setCurrentCursor(newStack[newStack.length - 1]);
    }
  }, [cursorStack]);

  const canGoBack = cursorStack.length > 1;

  // Suggestions from loaded resources
  const suggestions = useMemo(() => (
    resources.slice(0, 8).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      provider: r.provider,
    }))
  ), [resources]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">
          Browse and explore all discovered infrastructure resources.
        </p>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <ResourceSearch
          value={searchQuery}
          onSearch={setSearchQuery}
          suggestions={suggestions}
          onSuggestionSelect={(s) => navigate(`/resources/${s.id}`)}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block">
          <ResourceFilter
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Count */}
          <div className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${total} resource${total !== 1 ? 's' : ''} found`}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-2">
              {viewMode === 'table' ? (
                <Card>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-none first:rounded-t-md last:rounded-b-md" />
                  ))}
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-36 rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <Card>
              <CardContent className="p-8 text-center">
                <Server className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && sortedResources.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Server className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No resources found.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or run a discovery to populate resources.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Table view */}
          {!loading && !error && sortedResources.length > 0 && viewMode === 'table' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <span className="inline-flex items-center">
                        Name
                        <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('type')}
                    >
                      <span className="inline-flex items-center">
                        Type
                        <SortIcon field="type" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('provider')}
                    >
                      <span className="inline-flex items-center">
                        Provider
                        <SortIcon field="provider" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('region')}
                    >
                      <span className="inline-flex items-center">
                        Region
                        <SortIcon field="region" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center">
                        Status
                        <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('discoveredAt')}
                    >
                      <span className="inline-flex items-center">
                        Last Updated
                        <SortIcon field="discoveredAt" sortField={sortField} sortDirection={sortDirection} />
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResources.map((resource) => (
                    <TableRow
                      key={resource.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/resources/${resource.id}`)}
                    >
                      <TableCell className="font-medium">
                        <span className="truncate max-w-[200px] block">
                          {resource.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {resource.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', getProviderBadgeClass(resource.provider))}>
                          {resource.provider.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {resource.region || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', getStatusBg(resource.status))} variant="outline">
                          {resource.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {resource.discoveredAt ? formatRelativeTime(resource.discoveredAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Grid view */}
          {!loading && !error && sortedResources.length > 0 && viewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={(r) => navigate(`/resources/${r.id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && sortedResources.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {sortedResources.length} of {total} resources
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={!canGoBack}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
