import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  BarChart3,
  GitBranch,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import { cn, formatDate } from '@/lib/utils';

const REPORT_TYPES = [
  { value: 'all', label: 'All Resources', icon: <BarChart3 className="h-5 w-5" />, description: 'Generate documentation for all discovered resources' },
  { value: 'service', label: 'Services Only', icon: <GitBranch className="h-5 w-5" />, description: 'Generate documentation for service-type resources' },
  { value: 'runbook', label: 'Runbook Collection', icon: <BookOpen className="h-5 w-5" />, description: 'Generate runbooks for all critical services' },
  { value: 'security', label: 'Security Audit', icon: <Shield className="h-5 w-5" />, description: 'Security posture overview' },
];

interface DocEntry {
  id: string;
  type: string;
  target: string;
  title: string;
  generated: boolean;
  updated_at: string;
}

export function Reports() {
  const [selectedType, setSelectedType] = useState('all');
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    async function fetchDocs() {
      try {
        const resp = await fetch('/api/v1/docs/');
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        setDocs(Array.isArray(json) ? json : json.data || []);
      } catch (err) {
        console.error('Failed to fetch docs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const resp = await fetch('/api/v1/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types: selectedType === 'all' ? [] : [selectedType],
          all: selectedType === 'all',
        }),
      });
      if (resp.ok) {
        await resp.json();
        // Refresh the docs list after generation
        setTimeout(() => {
          fetch('/api/v1/docs/')
            .then((r) => r.json())
            .then((j) => setDocs(Array.isArray(j) ? j : j.data || []));
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to generate docs:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async (doc: DocEntry) => {
    setPreviewTitle(doc.title);
    setPreviewOpen(true);
    try {
      const resp = await fetch(`/api/v1/docs/${encodeURIComponent(doc.id)}`);
      if (resp.ok) {
        const json = await resp.json();
        setPreviewContent(json.content || 'No content available.');
      } else {
        setPreviewContent('Failed to load document.');
      }
    } catch {
      setPreviewContent('Failed to load document.');
    }
  };

  const filteredDocs = selectedType === 'all'
    ? docs
    : docs.filter((d) => d.type === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation Generator</h1>
        <p className="text-muted-foreground">Generate and browse infrastructure documentation.</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {REPORT_TYPES.map((type) => (
          <Card
            key={type.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedType === type.value && 'ring-2 ring-primary',
            )}
            onClick={() => setSelectedType(type.value)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {type.icon}
                <CardTitle className="text-sm">{type.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                {type.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate */}
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Documentation
            </>
          )}
        </Button>
        <Badge variant="outline" className="text-xs">
          {filteredDocs.length} documents
        </Badge>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Documents</CardTitle>
          <CardDescription>Browse and preview generated documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No documentation generated yet. Click "Generate Documentation" to create docs from your discovered infrastructure.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} {doc.updated_at && `- ${formatDate(doc.updated_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.generated ? 'default' : 'secondary'} className="text-[10px]">
                      {doc.generated ? 'Generated' : 'Auto'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const md = `# ${doc.title}\n\nSee documentation for details.`;
                        const blob = new Blob([md], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.target || doc.id}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      MD
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>Document preview</DialogDescription>
          </DialogHeader>
          <MarkdownRenderer content={previewContent} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
