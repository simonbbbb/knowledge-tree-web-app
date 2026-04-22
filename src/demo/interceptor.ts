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

    // Services
    if (p === '/api/v1/services/') {
      return json(SERVICES);
    }
    if (p.startsWith('/api/v1/services/') && p.endsWith('/dependencies')) {
      const name = decodeURIComponent(p.slice('/api/v1/services/'.length, -('/dependencies'.length)));
      return json(getDeps(name));
    }
    if (p.startsWith('/api/v1/services/')) {
      const name = decodeURIComponent(p.slice('/api/v1/services/'.length));
      const s = getSvc(name);
      if (!s) return json({ error: 'Not found' }, 404);
      return json(s);
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
        const run = { id: 'run-' + Math.floor(Math.random() * 10000), scope: scope?.name ?? 'Unknown', status: 'running', startedAt: new Date().toISOString(), completedAt: '', resourcesFound: 0, relationsFound: 0, errors: [] };
        RUNS.unshift(run as any);
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
      return json({ features: { autoDiscovery: true, aiAssistant: true, runbooks: true, confluenceSync: true } });
    }
    if (p === '/api/v1/admin/audit') {
      return json([]);
    }
    if (p === '/api/v1/admin/stats') {
      return json({ services: SERVICES.length, nodes: NODES.length, edges: EDGES.length, changes: CHANGES.length });
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

    // Fallback: unknown endpoint
    return json({ error: 'Demo endpoint not implemented', path: p, method }, 501);
  };
}
