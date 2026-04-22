import {
  Cloud,
  Database,
  Globe,
  Layers,
  Server,
  Shield,
  Network,
  HardDrive,
  Container,
  Box,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  status?: string;
  tags?: string[];
  relationshipCount?: number;
}

interface ResourceCardProps {
  resource: Resource;
  onClick?: (resource: Resource) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProviderIcon(provider: string) {
  switch (provider.toLowerCase()) {
    case 'aws':
      return <Cloud className="h-5 w-5 text-orange-500" />;
    case 'azure':
      return <Cloud className="h-5 w-5 text-blue-500" />;
    case 'gcp':
      return <Cloud className="h-5 w-5 text-green-500" />;
    case 'kubernetes':
      return <Container className="h-5 w-5 text-indigo-500" />;
    case 'dns':
      return <Globe className="h-5 w-5 text-purple-500" />;
    case 'confluence':
      return <Box className="h-5 w-5 text-teal-500" />;
    default:
      return <Server className="h-5 w-5 text-muted-foreground" />;
  }
}

function getCategoryIcon(type: string) {
  if (type.includes('database') || type.includes('rds') || type.includes('sql') ||
      type.includes('dynamodb') || type.includes('spanner') || type.includes('bigquery') ||
      type.includes('cosmos')) {
    return <Database className="h-3.5 w-3.5" />;
  }
  if (type.includes('vpc') || type.includes('subnet') || type.includes('network') ||
      type.includes('firewall') || type.includes('security_group') || type.includes('nsg') ||
      type.includes('load_balancer') || type.includes('elb') || type.includes('gateway') ||
      type.includes('route_table') || type.includes('dns')) {
    return <Network className="h-3.5 w-3.5" />;
  }
  if (type.includes('bucket') || type.includes('storage') || type.includes('volume') ||
      type.includes('disk') || type.includes('persistent_volume')) {
    return <HardDrive className="h-3.5 w-3.5" />;
  }
  if (type.includes('iam') || type.includes('role') || type.includes('policy') ||
      type.includes('key_vault') || type.includes('kms') || type.includes('secret')) {
    return <Shield className="h-3.5 w-3.5" />;
  }
  if (type.includes('eks') || type.includes('gke') || type.includes('aks') ||
      type.includes('container') || type.includes('cluster') || type.includes('deployment') ||
      type.includes('pod') || type.includes('service') || type.includes('namespace')) {
    return <Layers className="h-3.5 w-3.5" />;
  }
  return <Server className="h-3.5 w-3.5" />;
}

function getStatusDotColor(status?: string) {
  if (!status) return 'bg-muted-foreground';
  switch (status.toLowerCase()) {
    case 'running':
    case 'active':
    case 'healthy':
    case 'available':
      return 'bg-green-500';
    case 'stopped':
    case 'inactive':
    case 'terminated':
      return 'bg-red-500';
    case 'pending':
    case 'creating':
    case 'updating':
      return 'bg-yellow-500';
    default:
      return 'bg-muted-foreground';
  }
}

function getProviderColor(provider: string) {
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

export function ResourceCard({ resource, onClick, className }: ResourceCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all duration-200 group',
        className,
      )}
      onClick={() => onClick?.(resource)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Provider icon */}
            <div className="mt-0.5 shrink-0">
              {getProviderIcon(resource.provider)}
            </div>

            <div className="min-w-0 flex-1">
              {/* Name + status */}
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {resource.name}
                </h3>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    getStatusDotColor(resource.status),
                  )}
                  title={resource.status || 'Unknown'}
                />
              </div>

              {/* Type */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                {getCategoryIcon(resource.type)}
                <span className="truncate">{resource.type}</span>
              </div>

              {/* Region + Provider badge */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  {resource.region || 'global'}
                </Badge>
                <Badge className={cn('text-[10px]', getProviderColor(resource.provider))}>
                  {resource.provider.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Relationship count */}
          {resource.relationshipCount !== undefined && (
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-foreground">
                {resource.relationshipCount}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                relations
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
