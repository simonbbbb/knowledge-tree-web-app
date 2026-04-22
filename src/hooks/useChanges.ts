import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useChanges(params?: {
  scope?: string;
  type?: string;
  since?: string;
  until?: string;
}) {
  return useQuery({
    queryKey: ['changes', params],
    queryFn: () => api.changes.list(params),
  });
}
