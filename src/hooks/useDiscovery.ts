import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type DiscoveryScope } from '@/lib/api';
import { useDiscoveryStore } from '@/lib/store';

export function useDiscoveryRuns() {
  const { setRuns, setLoading } = useDiscoveryStore();

  return useQuery({
    queryKey: ['discovery', 'runs'],
    queryFn: async () => {
      setLoading(true);
      try {
        const runs = await api.discovery.listRuns();
        setRuns(runs);
        return runs;
      } finally {
        setLoading(false);
      }
    },
  });
}

export function useDiscoveryRun(id: string) {
  const { setCurrentRun } = useDiscoveryStore();

  return useQuery({
    queryKey: ['discovery', 'runs', id],
    queryFn: async () => {
      const run = await api.discovery.getRun(id);
      setCurrentRun(run);
      return run;
    },
    enabled: !!id,
  });
}

export function useDiscoveryScopes() {
  return useQuery({
    queryKey: ['discovery', 'scopes'],
    queryFn: () => api.discovery.listScopes(),
  });
}

export function useStartDiscovery() {
  const queryClient = useQueryClient();
  const { addRun } = useDiscoveryStore();

  return useMutation({
    mutationFn: (scopeId: string) => api.discovery.startRun(scopeId),
    onSuccess: (run) => {
      addRun(run);
      queryClient.invalidateQueries({ queryKey: ['discovery', 'runs'] });
    },
  });
}

export function useStartAllDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: undefined) => {
      const scopes = await api.discovery.listScopes();
      const enabledScopes = scopes.filter((s) => s.enabled);
      const results = await Promise.allSettled(
        enabledScopes.map((s) => api.discovery.startRun(s.id)),
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery', 'runs'] });
    },
  });
}

export function useCreateScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scope: Omit<DiscoveryScope, 'id' | 'lastRun' | 'resourceCount'> & { schedule?: string }) =>
      api.discovery.createScope(scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery', 'scopes'] });
    },
  });
}

export function useToggleScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.discovery.updateScope(id, { enabled } as Partial<DiscoveryScope>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery', 'scopes'] });
    },
  });
}
