import { useState, useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Provider configuration ──────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'aws', label: 'AWS', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { id: 'azure', label: 'Azure', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { id: 'gcp', label: 'GCP', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'kubernetes', label: 'Kubernetes', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { id: 'dns', label: 'DNS', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { id: 'confluence', label: 'Confluence', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
] as const;

const PROVIDER_TYPES: Record<string, string[]> = {
  aws: [
    'aws.ec2.instance', 'aws.ec2.security_group', 'aws.ec2.volume',
    'aws.s3.bucket', 'aws.rds.instance', 'aws.rds.cluster',
    'aws.lambda.function', 'aws.vpc', 'aws.subnet',
    'aws.elb.load_balancer', 'aws.iam.role', 'aws.sqs.queue',
    'aws.sns.topic', 'aws.dynamodb.table', 'aws.eks.cluster',
  ],
  azure: [
    'azure.compute.virtual_machine', 'azure.network.virtual_network',
    'azure.containerservice.managed_cluster', 'azure.sql.server',
    'azure.sql.database', 'azure.storage.account', 'azure.web.app_service',
    'azure.keyvault.vault', 'azure.documentdb.database_account',
  ],
  gcp: [
    'gcp.compute.instance', 'gcp.compute.network', 'gcp.container.cluster',
    'gcp.cloudsql.instance', 'gcp.bigquery.dataset', 'gcp.storage.bucket',
    'gcp.pubsub.topic', 'gcp.run.service', 'gcp.iam.service_account',
  ],
  kubernetes: [
    'k8s.namespace', 'k8s.deployment', 'k8s.service', 'k8s.pod',
    'k8s.config_map', 'k8s.ingress', 'k8s.persistent_volume_claim',
    'k8s.stateful_set', 'k8s.daemon_set', 'k8s.cron_job',
  ],
  dns: ['dns.record', 'dns.zone'],
  confluence: ['confluence.page', 'confluence.space'],
};

const REGIONS = [
  'All Regions',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-northeast-1', 'ap-south-1',
  'global',
];

const SCOPES = [
  'All Scopes',
  'production', 'staging', 'development', 'monitoring',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceFilterState {
  providers: string[];
  type: string;
  region: string;
  scope: string;
}

interface ResourceFilterProps {
  filters: ResourceFilterState;
  onFiltersChange: (filters: ResourceFilterState) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceFilter({ filters, onFiltersChange, className }: ResourceFilterProps) {
  const [localType, setLocalType] = useState(filters.type);

  const availableTypes = filters.providers.length > 0
    ? filters.providers.flatMap((p) => PROVIDER_TYPES[p] || [])
    : Object.values(PROVIDER_TYPES).flat();

  const uniqueTypes = [...new Set(availableTypes)].sort();

  const toggleProvider = useCallback((providerId: string) => {
    onFiltersChange({
      ...filters,
      providers: filters.providers.includes(providerId)
        ? filters.providers.filter((p) => p !== providerId)
        : [...filters.providers, providerId],
      type: '', // Reset type when providers change
    });
    setLocalType('');
  }, [filters, onFiltersChange]);

  const updateFilter = useCallback(<K extends keyof ResourceFilterState>(
    key: K,
    value: ResourceFilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const clearAll = useCallback(() => {
    onFiltersChange({ providers: [], type: '', region: '', scope: '' });
    setLocalType('');
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.providers.length > 0 ||
    filters.type !== '' ||
    filters.region !== '' ||
    filters.scope !== '';

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider checkboxes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Provider
          </label>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((provider) => {
              const isActive = filters.providers.includes(provider.id);
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => toggleProvider(provider.id)}
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? provider.color
                      : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {provider.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resource Type
          </label>
          <Select
            value={localType || '_all'}
            onValueChange={(val) => {
              const v = val === '_all' ? '' : val;
              setLocalType(v);
              updateFilter('type', v);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Types</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Region
          </label>
          <Select
            value={filters.region || '_all'}
            onValueChange={(val) => updateFilter('region', val === '_all' ? '' : val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r === 'All Regions' ? '_all' : r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scope dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Scope
          </label>
          <Select
            value={filters.scope || '_all'}
            onValueChange={(val) => updateFilter('scope', val === '_all' ? '' : val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Scopes" />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s} value={s === 'All Scopes' ? '_all' : s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {filters.providers.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px] gap-1">
                {PROVIDERS.find((pr) => pr.id === p)?.label || p}
                <button
                  type="button"
                  onClick={() => toggleProvider(p)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            {filters.type && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                {filters.type}
                <button
                  type="button"
                  onClick={() => { updateFilter('type', ''); setLocalType(''); }}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.region && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                {filters.region}
                <button
                  type="button"
                  onClick={() => updateFilter('region', '')}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.scope && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                {filters.scope}
                <button
                  type="button"
                  onClick={() => updateFilter('scope', '')}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
