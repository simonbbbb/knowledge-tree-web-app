// ─── Types ──────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  team: string;
  environment: string;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  description: string;
  language: string;
  repository: string;
  owner: string;
  tags: string[];
  upstreamCount: number;
  downstreamCount: number;
  lastDiscovered: string;
  coveragePercent: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'service' | 'database' | 'queue' | 'cache' | 'storage' | 'external' | 'infrastructure';
  team: string;
  environment: string;
  health: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'depends_on' | 'calls' | 'publishes' | 'subscribes' | 'reads_from' | 'writes_to';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DocPage {
  path: string;
  title: string;
  content: string;
  lastUpdated: string;
  source: string;
}

export interface DocTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocTreeItem[];
}

export interface Change {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'deployed';
  resourceType: string;
  resourceName: string;
  scope: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
  author?: string;
  details?: Record<string, unknown>;
}

export interface DiscoveryRun {
  id: string;
  scope: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  resourcesFound: number;
  relationsFound: number;
  errors: string[];
}

export interface DiscoveryScope {
  id: string;
  name: string;
  type: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'github';
  config: Record<string, unknown>;
  enabled: boolean;
  lastRun?: string;
  resourceCount: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  scope: string;
  lastUsed?: string;
  status: 'valid' | 'expired' | 'invalid';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastLogin?: string;
  avatar?: string;
}

export interface AIConfig {
  provider: string;
  model: string;
  apiKeyConfigured: boolean;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export interface Citation {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  relevance: number;
}

export interface DashboardStats {
  totalResources: number;
  totalRelations: number;
  totalServices: number;
  coveragePercent: number;
  recentChanges: number;
  activeDiscoveries: number;
  coverageByTeam: Array<{ team: string; coverage: number; total: number }>;
  changesByDay: Array<{ date: string; created: number; modified: number; deleted: number; deployed: number }>;
}

export interface ChangeStats {
  total: number;
  by_type: Record<string, number>;
  by_scope: Record<string, number>;
  by_day: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
  last_updated: string;
}

export interface SystemStats {
  version: string;
  commit: string;
  build_date: string;
  timestamp: string;
  total_resources: number;
  resources_by_provider: Record<string, number>;
  resources_by_type: Record<string, number>;
  total_scopes: number;
  active_scopes: number;
  storage_health: string;
  loaded_plugins: number;
  total_changes: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'coverage' | 'dependency' | 'security' | 'runbook';
  createdAt: string;
  status: 'generating' | 'ready' | 'failed';
  downloadUrl?: string;
}

export interface Runbook {
  id: string;
  title: string;
  service_name: string;
  content: string;
  template_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  status: string;
  tags?: string[];
}

export interface RunbookTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  category: string;
}

export interface ConfluenceConnection {
  id: string;
  name: string;
  base_url: string;
  space_key: string;
  username: string;
  created_at: string;
  status: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  space_key: string;
  status: string;
  content?: string;
  version: number;
  last_updated: string;
  url: string;
}

export interface ImportStatus {
  id: string;
  connection_id: string;
  status: string;
  total_pages: number;
  imported_pages: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── API Client ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

const AUTH_TOKEN_KEY = 'kt_auth_token';

function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach the stored JWT token to every request.
  const token = getStoredToken();
  if (token && !('Authorization' in (options.headers as Record<string, unknown>))) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ─── API Endpoints ──────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  dashboard: {
    getStats: () => request<DashboardStats>('/graph/export?format=json'),
  },

  // Services
  services: {
    list: (params?: { team?: string; environment?: string; health?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.team) query.set('team', params.team);
      if (params?.environment) query.set('environment', params.environment);
      if (params?.health) query.set('health', params.health);
      if (params?.search) query.set('search', params.search);
      const qs = query.toString();
      return request<PaginatedResponse<Service>>(`/services${qs ? `?${qs}` : ''}`);
    },
    get: (name: string) => request<Service>(`/services/${encodeURIComponent(name)}`),
    getDependencies: (name: string) => request<{ upstream: Service[]; downstream: Service[] }>(
      `/services/${encodeURIComponent(name)}/dependencies`,
    ),
  },

  // Graph
  graph: {
    get: (params?: { team?: string; type?: string; environment?: string; depth?: number }) => {
      const query = new URLSearchParams();
      if (params?.team) query.set('team', params.team);
      if (params?.type) query.set('type', params.type);
      if (params?.environment) query.set('environment', params.environment);
      if (params?.depth) query.set('depth', params.depth.toString());
      const qs = query.toString();
      return request<GraphData>(`/graph${qs ? `?${qs}` : ''}`);
    },
    getNode: (id: string) => request<GraphNode & { connections: GraphEdge[] }>(
      `/graph/nodes/${encodeURIComponent(id)}`,
    ),
  },

  // Documentation
  docs: {
    list: () => request<{ id: string; type: string; target: string; title: string; generated: boolean; updated_at: string }[]>('/docs/'),
    getPage: (path: string) => request<{ path: string; title: string; type: string; content: string; format: string }>(`/docs/${encodeURIComponent(path)}`),
    search: (query: string) => request<{ query: string; results: unknown[]; count: number }>('/docs/search', {
      method: 'POST',
      body: JSON.stringify({ query, max_results: 10 }),
    }),
    generate: (params?: { scope_id?: string; resource?: string; types?: string[]; all?: boolean }) =>
      request<{ task_id: string; status: string; message: string }>('/docs/generate', {
        method: 'POST',
        body: JSON.stringify(params || {}),
      }),
  },

  // Changes
  changes: {
    list: (params?: { scope?: string; type?: string; since?: string; until?: string }) => {
      const query = new URLSearchParams();
      if (params?.scope) query.set('scope', params.scope);
      if (params?.type) query.set('type', params.type);
      if (params?.since) query.set('since', params.since);
      if (params?.until) query.set('until', params.until);
      const qs = query.toString();
      return request<PaginatedResponse<Change>>(`/changes${qs ? `?${qs}` : ''}`);
    },
    stats: () => request<ChangeStats>('/changes/stats'),
  },

  // Discovery
  discovery: {
    listRuns: () => request<DiscoveryRun[]>('/discovery/runs'),
    getRun: (id: string) => request<DiscoveryRun>(`/discovery/runs/${id}`),
    startRun: (scopeId: string) => request<DiscoveryRun>('/discovery/runs', {
      method: 'POST',
      body: JSON.stringify({ scopeId }),
    }),
    listScopes: () => request<DiscoveryScope[]>('/discovery/scopes'),
    getScope: (id: string) => request<DiscoveryScope>(`/discovery/scopes/${id}`),
    createScope: (scope: Omit<DiscoveryScope, 'id' | 'lastRun' | 'resourceCount'>) =>
      request<DiscoveryScope>('/discovery/scopes', {
        method: 'POST',
        body: JSON.stringify(scope),
      }),
    updateScope: (id: string, scope: Partial<DiscoveryScope>) =>
      request<DiscoveryScope>(`/discovery/scopes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(scope),
      }),
    deleteScope: (id: string) =>
      request<void>(`/discovery/scopes/${id}`, { method: 'DELETE' }),
  },

  // Admin
  admin: {
    config: {
      get: () => request<Record<string, unknown>>('/admin/config'),
      update: (config: Record<string, unknown>) =>
        request<Record<string, unknown>>('/admin/config', {
          method: 'PUT',
          body: JSON.stringify(config),
        }),
    },
    audit: {
      list: () => request<unknown[]>('/admin/audit'),
    },
    stats: {
      get: () => request<Record<string, unknown>>('/admin/stats'),
    },
  },

  // AI Chat
  chat: {
    send: async (message: string, context?: Record<string, unknown>): Promise<ChatMessage> => {
      const resp = await request<{ type: string; content: string; citations?: Array<{ resource_id?: string; name?: string; resource_type?: string }> }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: resp.content,
        citations: resp.citations?.map((c) => ({
          resourceId: c.resource_id || '',
          resourceName: c.name || '',
          resourceType: c.resource_type || '',
          relevance: 1.0,
        })),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // Plugins
  plugins: {
    list: () => request<Plugin[]>('/plugins/'),
    get: (name: string) => request<Plugin>(`/plugins/${encodeURIComponent(name)}`),
    install: (path: string) =>
      request<Plugin>('/plugins/install', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
  },

  // Runbooks
  runbooks: {
    list: () => request<Runbook[]>('/runbooks/'),
    get: (id: string) => request<Runbook>(`/runbooks/${encodeURIComponent(id)}`),
    generate: (params: { service_name: string; template_id?: string; title?: string; tags?: string[] }) =>
      request<Runbook>('/runbooks/', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean; id: string }>(`/runbooks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    regenerate: (id: string, templateId?: string) =>
      request<Runbook>(`/runbooks/${encodeURIComponent(id)}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ template_id: templateId }),
      }),
    listTemplates: () => request<RunbookTemplate[]>('/runbooks/templates'),
  },

  // Confluence
  confluence: {
    listConnections: () => request<ConfluenceConnection[]>('/confluence/connections'),
    createConnection: (params: { name: string; base_url: string; space_key: string; username: string; token: string }) =>
      request<ConfluenceConnection>('/confluence/connections', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    deleteConnection: (id: string) =>
      request<{ deleted: boolean; id: string }>(`/confluence/connections/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    importSpace: (connectionId: string) =>
      request<ImportStatus>('/confluence/import/space', {
        method: 'POST',
        body: JSON.stringify({ connection_id: connectionId }),
      }),
    importPageTree: (connectionId: string, pageId: string) =>
      request<ImportStatus>('/confluence/import/page-tree', {
        method: 'POST',
        body: JSON.stringify({ connection_id: connectionId, page_id: pageId }),
      }),
    getImportStatus: (id: string) =>
      request<ImportStatus>(`/confluence/import/${encodeURIComponent(id)}/status`),
    searchPages: (connectionId: string, query: string, limit?: number) => {
      const params = new URLSearchParams({ connection_id: connectionId, q: query });
      if (limit) params.set('limit', limit.toString());
      return request<ConfluencePage[]>(`/confluence/pages/search?${params.toString()}`);
    },
    getPage: (connectionId: string, pageId: string) => {
      const params = new URLSearchParams({ connection_id: connectionId });
      return request<ConfluencePage>(`/confluence/pages/${encodeURIComponent(pageId)}?${params.toString()}`);
    },
  },
};

export { ApiError };
export default api;
