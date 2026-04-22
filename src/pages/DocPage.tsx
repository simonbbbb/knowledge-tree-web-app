import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';

export function DocPage() {
  const { path = '' } = useParams<{ path: string }>();
  const [page, setPage] = useState<{ title: string; content: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    async function fetchDoc() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/v1/docs/${encodeURIComponent(path)}`);
        if (!resp.ok) {
          if (resp.status === 404) throw new Error('Document not found');
          throw new Error(`API returned ${resp.status}`);
        }
        const json = await resp.json();
        setPage({
          title: json.title || json.path || path,
          content: json.content || '',
          type: json.type || 'unknown',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [path]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{page?.title}</h1>
        <Badge variant="outline" className="text-xs">{path}</Badge>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">{page?.type}</Badge>
            <span>Path: /docs/{path}</span>
          </div>
          <MarkdownRenderer content={page?.content || ''} />
        </div>
      </Card>
    </div>
  );
}
