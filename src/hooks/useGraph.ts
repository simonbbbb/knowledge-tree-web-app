import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGraphStore } from '@/lib/store';

export function useGraph() {
  const { filters, setData, setLoading } = useGraphStore();

  return useQuery({
    queryKey: ['graph', filters],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await api.graph.get({
          team: filters.team || undefined,
          type: filters.type || undefined,
          environment: filters.environment || undefined,
          depth: filters.depth,
        });
        setData(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
  });
}

export function useGraphNode(id: string) {
  return useQuery({
    queryKey: ['graph', 'nodes', id],
    queryFn: () => api.graph.getNode(id),
    enabled: !!id,
  });
}
