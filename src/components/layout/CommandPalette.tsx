import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Server, FileText, BookOpen, Wrench, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'service' | 'resource' | 'doc' | 'runbook' | 'page';
  path: string;
}

const STATIC_PAGES: SearchItem[] = [
  { id: 'page-dashboard', title: 'Dashboard', type: 'page', path: '/dashboard' },
  { id: 'page-resources', title: 'Resources', type: 'page', path: '/resources' },
  { id: 'page-services', title: 'Services', type: 'page', path: '/services' },
  { id: 'page-graph', title: 'Graph', type: 'page', path: '/graph' },
  { id: 'page-discovery', title: 'Discovery', type: 'page', path: '/discovery' },
  { id: 'page-docs', title: 'Documentation', type: 'page', path: '/docs' },
  { id: 'page-runbooks', title: 'Runbooks', type: 'page', path: '/runbooks' },
  { id: 'page-reports', title: 'Reports', type: 'page', path: '/reports' },
  { id: 'page-admin', title: 'Admin', type: 'page', path: '/admin/plugins' },
];

const TYPE_ICONS = {
  service: <Server className="h-4 w-4 text-blue-500" />,
  resource: <Globe className="h-4 w-4 text-green-500" />,
  doc: <FileText className="h-4 w-4 text-orange-500" />,
  runbook: <BookOpen className="h-4 w-4 text-purple-500" />,
  page: <Wrench className="h-4 w-4 text-muted-foreground" />,
};

const TYPE_LABELS = {
  service: 'Service',
  resource: 'Resource',
  doc: 'Doc',
  runbook: 'Runbook',
  page: 'Page',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle with Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fetch search items when opened
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    setLoading(true);
    Promise.all([
      fetch('/api/v1/services/').then((r) => r.ok ? r.json() : { data: [] }),
      fetch('/api/v1/resources/').then((r) => r.ok ? r.json() : { data: [] }),
      fetch('/api/v1/docs/').then((r) => r.ok ? r.json() : []),
      fetch('/api/v1/runbooks/').then((r) => r.ok ? r.json() : []),
    ]).then(([svcs, resources, docs, rbs]) => {
      const svcItems: SearchItem[] = (svcs.data || []).map((s: any) => ({
        id: `svc-${s.id}`,
        title: s.name,
        subtitle: s.team ? `${s.team} — ${s.health || 'healthy'}` : undefined,
        type: 'service' as const,
        path: `/services/${encodeURIComponent(s.name)}`,
      }));
      const resItems: SearchItem[] = (resources.data || []).map((r: any) => ({
        id: `res-${r.id}`,
        title: r.name,
        subtitle: `${r.type} — ${r.provider}`,
        type: 'resource' as const,
        path: `/resources/${encodeURIComponent(r.id)}`,
      }));
      const docItems: SearchItem[] = (Array.isArray(docs) ? docs : docs.data || []).map((d: any) => ({
        id: `doc-${d.id}`,
        title: d.title || d.target,
        subtitle: 'Documentation',
        type: 'doc' as const,
        path: `/docs/${encodeURIComponent(d.target || d.id)}`,
      }));
      const rbItems: SearchItem[] = (Array.isArray(rbs) ? rbs : rbs.data || []).map((r: any) => ({
        id: `rb-${r.id}`,
        title: r.title,
        subtitle: r.service_name || 'Runbook',
        type: 'runbook' as const,
        path: `/runbooks/${encodeURIComponent(r.id)}`,
      }));
      setItems([...STATIC_PAGES, ...svcItems, ...resItems, ...docItems, ...rbItems]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? items.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        (i.subtitle?.toLowerCase() || '').includes(query.toLowerCase())
      )
    : items;

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      navigate(item.path);
    },
    [navigate]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              placeholder="Search services, resources, docs, runbooks..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto text-base"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={onKeyDown}
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="space-y-0.5">
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                    idx === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item)}
                >
                  <div className="shrink-0">{TYPE_ICONS[item.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {TYPE_LABELS[item.type]}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">↑↓</span>
            </kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">↵</span>
            </kbd>
            to select
          </span>
          <span className="ml-auto">{filtered.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
