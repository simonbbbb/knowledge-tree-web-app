import { Search, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useGraphStore } from '@/lib/store';

const TYPES = ['All', 'service', 'database', 'queue', 'cache', 'storage', 'external', 'infrastructure'];

export function GraphFilters() {
  const { data, filters, setFilters, resetFilters } = useGraphStore();

  // Derive unique teams and environments from actual data
  const teams = ['All', ...Array.from(new Set((data?.nodes || []).map((n) => n.team).filter(Boolean)))];
  const environments = ['All', ...Array.from(new Set((data?.nodes || []).map((n) => n.environment).filter(Boolean)))];
  const counts = {
    total: data?.nodes.length ?? 0,
    filtered: data?.nodes.filter((n) => {
      if (filters.search && !n.label.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.type && n.type !== filters.type) return false;
      if (filters.team && n.team !== filters.team) return false;
      if (filters.environment && n.environment !== filters.environment) return false;
      return true;
    }).length ?? 0,
  };

  return (
    <div className="w-64 shrink-0 space-y-4 rounded-lg border bg-card p-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter nodes..."
              className="pl-7 h-8 text-xs"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
            {filters.search && (
              <button
                className="absolute right-2 top-2.5"
                onClick={() => setFilters({ search: '' })}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Team</Label>
          <Select
            value={filters.team || 'All'}
            onValueChange={(v) => setFilters({ team: v === 'All' ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'All' ? 'All' : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Resource Type</Label>
          <Select
            value={filters.type || 'All'}
            onValueChange={(v) => setFilters({ type: v === 'All' ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'All' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Environment</Label>
          <Select
            value={filters.environment || 'All'}
            onValueChange={(v) => setFilters({ environment: v === 'All' ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {environments.map((e) => (
                <SelectItem key={e} value={e}>
                  {e === 'All' ? 'All' : e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Depth: {filters.depth}</Label>
          <input
            type="range"
            min={1}
            max={6}
            value={filters.depth}
            onChange={(e) => setFilters({ depth: parseInt(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1 hop</span>
            <span>6 hops</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="text-[11px] text-muted-foreground">
        Showing {counts.filtered} of {counts.total} nodes
      </div>
    </div>
  );
}

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props} />;
}
