import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDocTree() {
  return useQuery({
    queryKey: ['docs', 'tree'],
    queryFn: () => api.docs.list(),
  });
}

export function useDocPage(path: string) {
  return useQuery({
    queryKey: ['docs', 'pages', path],
    queryFn: () => api.docs.getPage(path),
    enabled: !!path,
  });
}

export function useDocSearch(query: string) {
  return useQuery({
    queryKey: ['docs', 'search', query],
    queryFn: () => api.docs.search(query),
    enabled: query.length > 2,
  });
}
