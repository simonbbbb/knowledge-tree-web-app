import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, getStatusBg } from '@/lib/utils';

interface DiscoveredService {
  id: string;
  name: string;
  type: string;
  namespace: string;
  provider: string;
  image?: string;
  replicas?: string;
  cluster_ip?: string;
  port?: string;
  tags?: string[];
}

const NAMESPACES = ['All', 'production', 'monitoring', 'staging', 'kube-system', 'default'];
const TYPES = ['All', 'deployment', 'service'];

export function ServiceCatalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [nsFilter, setNsFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [services, setServices] = useState<DiscoveredService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const resp = await fetch('/api/v1/services/');
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        // API returns { data: [...] }
        const items = json.data || [];
        setServices(items.map((s: Record<string, unknown>) => ({
          id: String(s.id || ''),
          name: String(s.name || ''),
          type: String(s.type || ''),
          namespace: String(s.namespace || ''),
          provider: String(s.provider || ''),
          image: s.image ? String(s.image) : undefined,
          replicas: s.replicas ? String(s.replicas) : undefined,
          cluster_ip: s.cluster_ip ? String(s.cluster_ip) : undefined,
          port: s.port ? String(s.port) : undefined,
          tags: Array.isArray(s.tags) ? s.tags.map(String) : [],
        })));
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const filtered = services.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.namespace.toLowerCase().includes(search.toLowerCase());
    const matchesNs = nsFilter === 'All' || s.namespace === nsFilter;
    const matchesType = typeFilter === 'All' || s.type === `k8s.${typeFilter}`;
    return matchesSearch && matchesNs && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Catalog</h1>
        <p className="text-muted-foreground">
          Browse and search all discovered services.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={nsFilter} onValueChange={setNsFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Namespace" />
          </SelectTrigger>
          <SelectContent>
            {NAMESPACES.map((n) => (
              <SelectItem key={n} value={n}>{n === 'All' ? 'All Namespaces' : n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service count */}
      <div className="text-sm text-muted-foreground">
        {loading ? 'Loading...' : `Showing ${filtered.length} of ${services.length} services`}
      </div>

      {/* Service Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service) => (
          <Card
            key={service.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/services/${service.name}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </div>
                <Badge className={cn('text-[10px]', getStatusBg('healthy'))} variant="outline">
                  {service.type.replace('k8s.', '')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{service.namespace}</Badge>
                  <Badge variant="outline" className="text-[10px]">{service.provider}</Badge>
                </div>
                {service.image && (
                  <p className="text-xs truncate">{service.image}</p>
                )}
                {service.replicas && (
                  <p className="text-xs">Replicas: {service.replicas}</p>
                )}
                {service.cluster_ip && (
                  <p className="text-xs">Cluster IP: {service.cluster_ip}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
