import { DEMO_LOGIN, DEMO_USER, SERVICES, NODES, EDGES, CHANGES, SCOPES, RUNS, DOCS_LIST, getDocPage, RUNBOOKS, PLUGINS, CONFLUENCE, getSvc, getDeps } from './fixtures';

let installed = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function installDemoInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString(), window.location.href);
    const method = (init?.method ?? 'GET').toUpperCase();

    if (!url.pathname.startsWith('/api/v1/')) {
      return originalFetch(input, init);
    }

    const p = url.pathname;
    const body = init?.body ? JSON.parse(init.body as string) : {};

    await delay(120 + Math.random() * 180); // 120-300ms simulated latency

    // Auth
    if (p === '/api/v1/auth/login' && method === 'POST') {
      return json(DEMO_LOGIN);
    }
    if (p === '/api/v1/auth/me') {
      return json(DEMO_USER);
    }
    if (p === '/api/v1/auth/logout') {
      return json({ ok: true });
    }

    // Resources
    if (p === '/api/v1/resources/' || p === '/api/v1/resources') {
      const resources = NODES.map((n: any) => ({
        id: n.id,
        name: n.label || n.name || n.id,
        type: n.type || 'service',
        provider: n.metadata?.provider || (n.type === 'service' ? 'Kubernetes' : 'AWS'),
        region: 'us-east-1',
        status: n.health || 'healthy',
        tags: n.metadata?.tags || [],
        properties: n.metadata || {},
        discoveredAt: new Date().toISOString(),
        relationshipCount: EDGES.filter((e: any) => e.source === n.id || e.target === n.id).length,
      }));
      return json({ data: resources, total: resources.length, cursor: null, has_more: false });
    }
    const resourceMatch = p.match(/^\/api\/v1\/resources\/([^/]+)$/);
    if (resourceMatch) {
      const id = decodeURIComponent(resourceMatch[1]);
      const node = NODES.find((n: any) => n.id === id) as any;
      if (!node) return json({ error: 'Not found' }, 404);
      return json({
        id: node.id,
        name: node.label || node.name || node.id,
        type: node.type || 'service',
        provider: (node.metadata as any)?.provider || (node.type === 'service' ? 'Kubernetes' : 'AWS'),
        region: 'us-east-1',
        status: node.health || 'healthy',
        tags: (node.metadata as any)?.tags || [],
        properties: node.metadata || {},
        discoveredAt: new Date().toISOString(),
        relationshipCount: EDGES.filter((e: any) => e.source === node.id || e.target === node.id).length,
      });
    }
    const relMatch = p.match(/^\/api\/v1\/resources\/([^/]+)\/relationships/);
    if (relMatch) {
      const id = decodeURIComponent(relMatch[1]);
      const dir = url.searchParams.get('direction') || 'outgoing';
      const related = EDGES.filter((e: any) => {
        if (dir === 'outgoing') return e.source === id;
        if (dir === 'incoming') return e.target === id;
        return e.source === id || e.target === id;
      }).map((e: any) => {
        const otherId = dir === 'outgoing' ? e.target : e.source;
        const other = NODES.find((n: any) => n.id === otherId) as any;
        return {
          id: otherId,
          name: other?.label || other?.name || otherId,
          type: other?.type || 'service',
          provider: (other?.metadata as any)?.provider || 'AWS',
          relationType: e.label || 'depends_on',
          region: 'us-east-1',
        };
      });
      return json({ data: related });
    }
    const changesMatch = p.match(/^\/api\/v1\/resources\/([^/]+)\/changes/);
    if (changesMatch) {
      const id = decodeURIComponent(changesMatch[1]);
      const node = NODES.find((n: any) => n.id === id) as any;
      const name = node?.label || node?.name || id;
      const recentChanges = CHANGES.slice(0, 5).map((c: any) => ({
        id: c.id,
        type: c.type,
        resourceType: node?.type || 'service',
        resourceName: name,
        description: c.description || `${c.type} ${name}`,
        timestamp: c.timestamp,
      }));
      return json({ data: recentChanges });
    }

    // Services
    if (p === '/api/v1/services/' || p === '/api/v1/services') {
      const svcs = SERVICES.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'deployment',
        namespace: s.team,
        provider: 'Kubernetes',
        image: `${s.name}:v1.0.0`,
        replicas: '3',
        cluster_ip: '10.0.1.' + Math.floor(Math.random()*255),
        port: '8080',
        tags: s.tags || [],
        ...s,
      }));
      return json({ data: svcs });
    }
    if (p.startsWith('/api/v1/services/') && p.endsWith('/dependencies')) {
      const name = decodeURIComponent(p.slice('/api/v1/services/'.length, -('/dependencies'.length)));
      return json(getDeps(name));
    }
    if (p.startsWith('/api/v1/services/')) {
      const name = decodeURIComponent(p.slice('/api/v1/services/'.length));
      const s = getSvc(name);
      if (!s) return json({ error: 'Not found' }, 404);
      const deps = getDeps(name);
      const doc = DOCS_LIST.find((d: any) => d.target === name);
      const rb = RUNBOOKS.find((r: any) => r.service_name === name);
      const svcChanges = CHANGES.filter((c: any) => c.description?.toLowerCase().includes(name.toLowerCase())).slice(0, 5);
      const metrics = {
        latency_p50: 8 + Math.floor(Math.random() * 20),
        latency_p99: 45 + Math.floor(Math.random() * 80),
        error_rate: (Math.random() * 0.5).toFixed(3),
        throughput_rps: 500 + Math.floor(Math.random() * 4000),
        cpu_percent: 15 + Math.floor(Math.random() * 40),
        memory_percent: 30 + Math.floor(Math.random() * 50),
      };
      return json({ data: [{ ...s, type: 'deployment', namespace: s.team, provider: 'Kubernetes', image: `${s.name}:v1.0.0`, replicas: '3', dependencies: deps, doc_id: doc?.id, runbook_id: rb?.id, recent_changes: svcChanges, metrics }] });
    }

    // Graph
    if (p === '/api/v1/graph/export') {
      return json({ nodes: NODES, edges: EDGES });
    }
    if (p.startsWith('/api/v1/graph/node/')) {
      const id = decodeURIComponent(p.slice('/api/v1/graph/node/'.length));
      const node = NODES.find((n) => n.id === id);
      if (!node) return json({ error: 'Not found' }, 404);
      return json(node);
    }

    // Changes
    if (p === '/api/v1/changes/') {
      return json(CHANGES);
    }
    if (p === '/api/v1/changes/stats') {
      return json({ total: CHANGES.length, byType: { created: CHANGES.filter((c) => c.type === 'created').length, modified: CHANGES.filter((c) => c.type === 'modified').length, deleted: CHANGES.filter((c) => c.type === 'deleted').length, deployed: CHANGES.filter((c) => c.type === 'deployed').length } });
    }

    // Discovery
    if (p === '/api/v1/discovery/scopes') {
      if (method === 'GET') return json(SCOPES);
      if (method === 'POST') {
        const newScope = { id: 'scope-' + Math.floor(Math.random() * 10000), ...body, enabled: body.enabled ?? true, lastRun: '', resourceCount: 0 };
        SCOPES.push(newScope as any);
        return json(newScope, 201);
      }
    }
    if (p.startsWith('/api/v1/discovery/scopes/')) {
      const scopeId = decodeURIComponent(p.slice('/api/v1/discovery/scopes/'.length));
      if (method === 'DELETE') {
        const idx = SCOPES.findIndex((s) => s.id === scopeId);
        if (idx >= 0) SCOPES.splice(idx, 1);
        return json({ deleted: true }, 204);
      }
      if (method === 'PUT') {
        const scope = SCOPES.find((s) => s.id === scopeId);
        if (!scope) return json({ error: 'Not found' }, 404);
        Object.assign(scope, body);
        return json(scope);
      }
      const scope = SCOPES.find((s) => s.id === scopeId);
      if (!scope) return json({ error: 'Not found' }, 404);
      return json(scope);
    }
    if (p === '/api/v1/discovery/runs') {
      if (method === 'POST') {
        const scopeId = body.scopeId;
        const scope = SCOPES.find((s) => s.id === scopeId);
        const runId = 'run-' + Math.floor(Math.random() * 10000);
        const run = { id: runId, scopeId: scope?.id ?? '', scope: scope?.name ?? 'Unknown', status: 'running', startedAt: new Date().toISOString(), completedAt: '', resourcesFound: 0, relationsFound: 0, errors: [] };
        RUNS.unshift(run as any);
        // Simulate run completion after 5 seconds
        setTimeout(() => {
          const r = RUNS.find((x: any) => x.id === runId);
          if (r) {
            r.status = 'completed';
            r.completedAt = new Date().toISOString();
            r.resourcesFound = 12 + Math.floor(Math.random() * 40);
            r.relationsFound = 8 + Math.floor(Math.random() * 30);
          }
        }, 5000);
        return json(run, 201);
      }
      return json(RUNS);
    }
    if (p.startsWith('/api/v1/discovery/runs/')) {
      const runId = decodeURIComponent(p.slice('/api/v1/discovery/runs/'.length));
      const run = RUNS.find((r) => r.id === runId);
      if (!run) return json({ error: 'Not found' }, 404);
      return json(run);
    }

    // Documentation
    if (p === '/api/v1/docs/' || p === '/api/v1/documentation/') {
      return json(DOCS_LIST);
    }
    if (p.startsWith('/api/v1/docs/') || p.startsWith('/api/v1/documentation/')) {
      const base = p.startsWith('/api/v1/docs/') ? '/api/v1/docs/' : '/api/v1/documentation/';
      const id = decodeURIComponent(p.slice(base.length));
      if (id === 'search' && method === 'POST') {
        const q = body.query ?? '';
        const results = DOCS_LIST.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()) || d.target.toLowerCase().includes(q.toLowerCase()));
        return json({ query: q, results, count: results.length });
      }
      const page = getDocPage(id);
      if (!page) return json({ error: 'Not found' }, 404);
      return json(page);
    }
    if ((p === '/api/v1/docs/generate' || p === '/api/v1/documentation/generate') && method === 'POST') {
      return json({ task_id: 'gen-' + Math.floor(Math.random() * 10000), status: 'queued', message: 'Documentation generation started (demo).' });
    }

    // Runbooks
    if (p === '/api/v1/runbooks/') {
      if (method === 'POST') return json({ ...body, id: 'rb-' + Math.floor(Math.random() * 10000) }, 201);
      return json(RUNBOOKS);
    }
    if (p.startsWith('/api/v1/runbooks/')) {
      const id = decodeURIComponent(p.slice('/api/v1/runbooks/'.length));
      if (id.endsWith('/regenerate')) {
        return json({ id: id.replace('/regenerate', ''), regenerated: true });
      }
      if (method === 'DELETE') return json({ deleted: true, id }, 204);
      const rb = RUNBOOKS.find((r) => r.id === id);
      if (!rb) return json({ error: 'Not found' }, 404);
      return json(rb);
    }
    if (p === '/api/v1/runbooks/templates') {
      return json([
        { id: 'tmpl-1', name: 'Incident response', service_name: '', content: 'TODO', tags: ['incident'] },
        { id: 'tmpl-2', name: 'Deployment checklist', service_name: '', content: 'TODO', tags: ['deployment'] },
      ]);
    }

    // Chat
    if (p === '/api/v1/chat/message' && method === 'POST') {
      const q = body.message ?? '';
      let reply = "I'm the Knowledge Tree AI assistant. In this demo environment I can only provide pre-programmed responses.";
      if (q.toLowerCase().includes('payment')) reply = 'The payments-service is currently degraded. Check Stripe dashboard status and kafka-events broker lag.';
      else if (q.toLowerCase().includes('order')) reply = 'The orders-service is healthy. It depends on db-orders and kafka-events.';
      else if (q.toLowerCase().includes('catalog')) reply = 'catalog-api is healthy and serves the browse traffic from web-gateway.';
      else if (q.toLowerCase().includes('graph') || q.toLowerCase().includes('topology')) reply = 'The demo graph contains 28 nodes and 38 edges across services, databases, caches, queues, and external APIs.';
      return json({ message: reply, model: 'demo-gpt', citations: [] });
    }

    // Admin
    if (p === '/api/v1/admin/config') {
      if (method === 'PUT') return json({ ...body, saved: true });
      return json({ features: { autoDiscovery: true, aiAssistant: true, runbooks: true, confluenceSync: true }, llm: { provider: 'openai', model: 'gpt-4o', api_key_configured: true, base_url: '' }, enricher: { provider: 'openai', model: 'gpt-4o', api_key_configured: true, base_url: '' } });
    }
    if (p === '/api/v1/admin/audit') {
      return json([]);
    }
    if (p === '/api/v1/admin/stats') {
      return json({ services: SERVICES.length, nodes: NODES.length, edges: EDGES.length, changes: CHANGES.length });
    }
    if (p === '/api/v1/admin/users') {
      if (method === 'POST') {
        return json({ id: 'u-' + Math.floor(Math.random()*10000), ...body, active: true, created_at: new Date().toISOString() }, 201);
      }
      return json([
        { id: 'u-demo-001', username: 'demo', email: 'demo@knowledgetree.example', display_name: 'Demo Admin', role: 'admin', active: true, created_at: '2026-04-01T00:00:00Z', last_login: new Date().toISOString() },
        { id: 'u-002', username: 'sarah', email: 'sarah@knowledgetree.example', display_name: 'Sarah Chen', role: 'editor', active: true, created_at: '2026-04-05T00:00:00Z', last_login: new Date().toISOString() },
        { id: 'u-003', username: 'mike', email: 'mike@knowledgetree.example', display_name: 'Mike Ross', role: 'viewer', active: true, created_at: '2026-04-08T00:00:00Z', last_login: new Date().toISOString() },
      ]);
    }
    if (p.match(/^\/api\/v1\/admin\/users\/[^/]+$/)) {
      if (method === 'DELETE') return json({ deleted: true }, 204);
      return json({ id: 'u-demo-001', username: 'demo', role: 'admin', active: true });
    }
    if (p === '/api/v1/admin/credentials') {
      if (method === 'POST') {
        return json({ id: 'cred-' + Math.floor(Math.random()*10000), ...body, status: 'valid', created_at: new Date().toISOString() }, 201);
      }
      return json([
        { id: 'cred-001', name: 'Production AWS', type: 'aws', scope: 'global', status: 'valid', created_at: '2026-04-01T00:00:00Z', last_used: new Date().toISOString(), description: 'Primary AWS account for production infrastructure', metadata: { key_hint: 'AKIA...7XJQ' } },
        { id: 'cred-002', name: 'Staging AWS', type: 'aws', scope: 'staging', status: 'valid', created_at: '2026-04-02T00:00:00Z', last_used: new Date().toISOString(), description: 'Staging environment AWS credentials', metadata: { key_hint: 'AKIA...3ABC' } },
        { id: 'cred-003', name: 'Kubernetes Cluster', type: 'kubernetes', scope: 'global', status: 'valid', created_at: '2026-04-03T00:00:00Z', last_used: new Date().toISOString(), description: 'Kubeconfig for EKS production cluster', metadata: {} },
      ]);
    }
    const credDetailMatch = p.match(/^\/api\/v1\/admin\/credentials\/([^/]+)$/);
    if (credDetailMatch) {
      if (method === 'DELETE') return json({ deleted: true }, 204);
      return json({ id: credDetailMatch[1], name: 'Demo Credential', type: 'aws', status: 'valid' });
    }
    const credTestMatch = p.match(/^\/api\/v1\/admin\/credentials\/([^/]+)\/test$/);
    if (credTestMatch && method === 'POST') {
      return json({ status: 'success', message: 'Credential test passed', id: credTestMatch[1] });
    }

    // Dashboard
    if (p === '/api/v1/dashboard') {
      return json({ serviceCount: SERVICES.length, resourceCount: NODES.length, edgeCount: EDGES.length, changeCount: CHANGES.length, coverageAvg: Math.round(SERVICES.reduce((a, s) => a + s.coverage, 0) / SERVICES.length), lastDiscovery: new Date().toISOString() });
    }

    // Plugins
    if (p === '/api/v1/plugins/') {
      return json(PLUGINS);
    }
    if (p.startsWith('/api/v1/plugins/') && p.endsWith('/install')) {
      return json({ installed: true });
    }
    if (p.startsWith('/api/v1/plugins/')) {
      const name = decodeURIComponent(p.slice('/api/v1/plugins/'.length));
      const pl = PLUGINS.find((p) => p.name === name);
      if (!pl) return json({ error: 'Not found' }, 404);
      return json(pl);
    }

    // Confluence
    if (p === '/api/v1/confluence/connections') {
      return json(CONFLUENCE);
    }
    if (p === '/api/v1/confluence/import/space' && method === 'POST') {
      return json({ status: 'queued', importId: 'imp-' + Math.floor(Math.random() * 10000) });
    }
    if (p.startsWith('/api/v1/confluence/import/') && p.endsWith('/status')) {
      return json({ status: 'completed', processed: 12, errors: 0 });
    }
    if (p === '/api/v1/confluence/pages/search') {
      return json([{ id: 'page-1', title: 'Getting started', url: 'https://example.atlassian.net/wiki/spaces/KT/pages/1' }]);
    }
    if (p.startsWith('/api/v1/confluence/pages/')) {
      const pageId = decodeURIComponent(p.slice('/api/v1/confluence/pages/'.length).split('?')[0]);
      return json({ id: pageId, title: 'Demo page', content: '# Demo content\n\nThis is a placeholder Confluence page.', url: 'https://example.atlassian.net/wiki/spaces/KT/pages/' + pageId });
    }

    // Reports
    if (p === '/api/v1/reports' || p === '/api/v1/reports/') {
      return json({
        cost_allocation: [
          { team: 'platform', services: 4, monthly_cost_usd: 12450 },
          { team: 'checkout', services: 5, monthly_cost_usd: 28900 },
          { team: 'catalog', services: 3, monthly_cost_usd: 18700 },
          { team: 'growth', services: 2, monthly_cost_usd: 5600 },
        ],
        discovery_coverage: { total: NODES.length, documented: DOCS_LIST.length, coverage_percent: Math.round((DOCS_LIST.length / NODES.length) * 100) },
        top_risks: [
          { id: 'ch-1', service: 'payments-service', description: 'v1.9.0 rollback due to malformed JSON from upstream', severity: 'high' },
          { id: 'ch-2', service: 'orders-postgres', description: 'CPU spike to 89% during checkout peak', severity: 'medium' },
          { id: 'ch-3', service: 'web-gateway', description: 'WAF blocked 15% legitimate traffic during rule update', severity: 'medium' },
          { id: 'ch-4', service: 'inventory-service', description: 'Flash sale caused 3-minute reservation backlog', severity: 'low' },
          { id: 'ch-5', service: 'notifications-service', description: 'Twilio API latency degraded SMS delivery by 8s', severity: 'low' },
        ],
        sla_compliance: [
          { service: 'web-gateway', sla: '99.95%', uptime: '99.98%', status: 'passing' },
          { service: 'checkout-api', sla: '99.95%', uptime: '99.97%', status: 'passing' },
          { service: 'payments-service', sla: '99.99%', uptime: '99.94%', status: 'failing' },
          { service: 'identity-service', sla: '99.99%', uptime: '99.99%', status: 'passing' },
          { service: 'catalog-api', sla: '99.95%', uptime: '99.96%', status: 'passing' },
          { service: 'orders-service', sla: '99.95%', uptime: '99.95%', status: 'passing' },
        ],
      });
    }

    // Fallback: unknown endpoint
    return json({ error: 'Demo endpoint not implemented', path: p, method }, 501);
  };
}
