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
      return json(SCOPES);
    }
    if (p === '/api/v1/discovery/runs') {
      return json(RUNS);
    }

    // Documentation
    if (p === '/api/v1/documentation/') {
      return json(DOCS_LIST);
    }
    if (p.startsWith('/api/v1/documentation/')) {
      const id = decodeURIComponent(p.slice('/api/v1/documentation/'.length));
      const page = getDocPage(id);
      if (!page) return json({ error: 'Not found' }, 404);
      return json(page);
    }

    // Runbooks
    if (p === '/api/v1/runbooks/') {
      return json(RUNBOOKS);
    }
    if (p.startsWith('/api/v1/runbooks/') && p.endsWith('/regenerate')) {
      return json({ id: p.split('/')[4], regenerated: true });
    }
    if (p.startsWith('/api/v1/runbooks/')) {
      const id = decodeURIComponent(p.slice('/api/v1/runbooks/'.length));
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
      return json({ message: reply, model: 'demo-gpt' });
    }

    // Admin / config / stats
    if (p === '/api/v1/admin/config') {
      return json({ features: { autoDiscovery: true, aiAssistant: true, runbooks: true, confluenceSync: true } });
    }
    if (p === '/api/v1/admin/stats') {
      return json({ services: SERVICES.length, nodes: NODES.length, edges: EDGES.length, changes: CHANGES.length });
    }

    // Plugins
    if (p === '/api/v1/plugins/') {
      return json(PLUGINS);
    }

    // Confluence
    if (p === '/api/v1/confluence/connections') {
      return json(CONFLUENCE);
    }
    if (p === '/api/v1/confluence/import/space' && method === 'POST') {
      return json({ status: 'queued', importId: 'imp-' + Math.floor(Math.random() * 10000) });
    }

    // Fallback: unknown endpoint
    return json({ error: 'Demo endpoint not implemented', path: p, method }, 501);
  };
}
