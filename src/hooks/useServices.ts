import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useServices(params?: {
  team?: string;
  environment?: string;
  health?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => api.services.list(params),
  });
}

export function useService(name: string) {
  return useQuery({
    queryKey: ['services', name],
    queryFn: () => api.services.get(name),
    enabled: !!name,
  });
}

export function useServiceDependencies(name: string) {
  return useQuery({
    queryKey: ['services', name, 'dependencies'],
    queryFn: () => api.services.getDependencies(name),
    enabled: !!name,
  });
}
