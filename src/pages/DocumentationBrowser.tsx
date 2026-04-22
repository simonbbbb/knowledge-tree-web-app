import { useState, useEffect, useCallback } from 'react';
import { FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DocSidebar } from '@/components/docs/DocSidebar';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import type { DocTreeItem } from '@/lib/api';

interface DocEntry {
  id: string;
  type: string;
  target: string;
  title: string;
  generated: boolean;
  updated_at: string;
}

interface DocContent {
  path: string;
  title: string;
  type: string;
  content: string;
  format: string;
}

const welcomeContent = `# Documentation Browser

Welcome to the Knowledge Tree documentation browser. Select a document from the sidebar to view its contents.

## Features

- **Auto-generated docs**: Documentation is generated from your infrastructure
- **Mermaid diagrams**: Supports inline Mermaid diagrams
- **Full markdown**: GFM tables, code blocks, and more
- **Search**: Search across all documentation

Select a page from the sidebar to get started.
`;

function groupDocsToTree(docs: DocEntry[]): DocTreeItem[] {
  const groups = new Map<string, DocEntry[]>();
  for (const doc of docs) {
    const key = doc.type || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(doc);
  }

  return Array.from(groups.entries()).map(([type, entries]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1) + 's',
    path: type,
    type: 'directory' as const,
    children: entries.map((e) => ({
      name: e.title || e.target,
      path: e.id,
      type: 'file' as const,
    })),
  }));
}

export function DocumentationBrowser() {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [tree, setTree] = useState<DocTreeItem[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDocs() {
      try {
        const resp = await fetch('/api/v1/docs/');
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        const docList: DocEntry[] = Array.isArray(json) ? json : json.data || [];
        setDocs(docList);
        setTree(groupDocsToTree(docList));
      } catch (err) {
        console.error('Failed to fetch docs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const handleSelect = useCallback(async (path: string) => {
    setActivePath(path);
    setDocLoading(true);
    try {
      const resp = await fetch(`/api/v1/docs/${encodeURIComponent(path)}`);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const json = await resp.json();
      setActiveDoc(json);
    } catch (err) {
      console.error('Failed to fetch doc:', err);
      setActiveDoc(null);
    } finally {
      setDocLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const resp = await fetch('/api/v1/docs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const json = await resp.json();
      const results = json.results || [];
      if (results.length > 0) {
        handleSelect(results[0].id || results[0].name);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [searchQuery, handleSelect]);

  const content = activeDoc?.content || welcomeContent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">Browse auto-generated infrastructure documentation.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search docs..."
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Badge variant="outline" className="text-xs">
            {docs.length} documents
          </Badge>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-14rem)]">
        {/* Sidebar */}
        {loading ? (
          <div className="w-64 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <DocSidebar
            tree={tree}
            activePath={activePath || undefined}
            onSelect={handleSelect}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 rounded-lg border bg-card overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">
                  {activeDoc?.title || 'Documentation Browser'}
                </h2>
              </div>
              {activeDoc && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {activeDoc.type}
                  </Badge>
                  {activeDoc.format && (
                    <Badge variant="secondary" className="text-[10px]">
                      {activeDoc.format}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {docLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
