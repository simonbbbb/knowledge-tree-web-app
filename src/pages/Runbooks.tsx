import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  Clock,
  Tag,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatRelativeTime, getStatusBg } from '@/lib/utils';
import type { Runbook, RunbookTemplate } from '@/lib/api';
import { api } from '@/lib/api';

const DOC_TYPE_BADGES: Record<string, { label: string; className: string }> = {
  runbook: { label: 'Runbook', className: 'bg-blue-500/10 text-blue-500' },
  dependency_map: { label: 'Dependency Map', className: 'bg-purple-500/10 text-purple-500' },
  adr: { label: 'ADR', className: 'bg-amber-500/10 text-amber-500' },
  incident_guide: { label: 'Incident Guide', className: 'bg-red-500/10 text-red-500' },
  architecture_doc: { label: 'Architecture', className: 'bg-teal-500/10 text-teal-500' },
  sop: { label: 'SOP', className: 'bg-indigo-500/10 text-indigo-500' },
};

function getDocTypeBadge(templateId: string) {
  const match = DOC_TYPE_BADGES[templateId];
  if (match) return match;
  return { label: templateId || 'Runbook', className: 'bg-muted text-muted-foreground' };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { label: 'Generating', className: getStatusBg('pending') };
    case 'published':
      return { label: 'Complete', className: getStatusBg('success') };
    case 'failed':
      return { label: 'Failed', className: getStatusBg('failed') };
    default:
      return { label: status, className: getStatusBg(status) };
  }
}

export function Runbooks() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [templates, setTemplates] = useState<RunbookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate dialog form state
  const [genServiceName, setGenServiceName] = useState('');
  const [genTemplateId, setGenTemplateId] = useState('');
  const [genTitle, setGenTitle] = useState('');
  const [genTags, setGenTags] = useState('');

  const fetchRunbooks = useCallback(async () => {
    try {
      const data = await api.runbooks.list();
      setRunbooks(data || []);
    } catch (err) {
      console.error('Failed to fetch runbooks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await api.runbooks.listTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  useEffect(() => {
    fetchRunbooks();
    fetchTemplates();
  }, [fetchRunbooks, fetchTemplates]);

  const handleGenerate = async () => {
    if (!genServiceName.trim()) return;
    setGenerating(true);
    try {
      const tags = genTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await api.runbooks.generate({
        service_name: genServiceName,
        template_id: genTemplateId || undefined,
        title: genTitle || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setShowGenerateDialog(false);
      setGenServiceName('');
      setGenTemplateId('');
      setGenTitle('');
      setGenTags('');
      await fetchRunbooks();
    } catch (err) {
      console.error('Failed to generate runbook:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.runbooks.delete(id);
      if (selectedRunbook?.id === id) {
        setSelectedRunbook(null);
      }
      await fetchRunbooks();
    } catch (err) {
      console.error('Failed to delete runbook:', err);
    }
  };

  const handleRegenerate = async (runbook: Runbook) => {
    try {
      const updated = await api.runbooks.regenerate(runbook.id);
      await fetchRunbooks();
      if (selectedRunbook?.id === runbook.id) {
        setSelectedRunbook(updated);
      }
    } catch (err) {
      console.error('Failed to regenerate runbook:', err);
    }
  };

  const filtered = runbooks.filter((rb) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rb.title.toLowerCase().includes(q) ||
      rb.service_name.toLowerCase().includes(q) ||
      rb.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Detail view for a selected runbook
  if (selectedRunbook) {
    const docBadge = getDocTypeBadge(selectedRunbook.template_id);
    const statusBadge = getStatusBadge(selectedRunbook.status);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRunbook(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('text-[10px]', docBadge.className)} variant="outline">
                {docBadge.label}
              </Badge>
              <Badge className={cn('text-[10px]', statusBadge.className)} variant="outline">
                {statusBadge.label}
              </Badge>
              {selectedRunbook.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedRunbook.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Service: {selectedRunbook.service_name} | Version {selectedRunbook.version}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Updated {formatRelativeTime(selectedRunbook.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerate(selectedRunbook)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(selectedRunbook.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedRunbook.content}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runbooks</h1>
          <p className="text-muted-foreground">
            Auto-generated operational runbooks for your services.
          </p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Runbook
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search runbooks..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Templates section */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Available Templates</CardTitle>
            <CardDescription>Select a template when generating a new runbook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="rounded-md border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm">{tmpl.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tmpl.sections.slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                    {tmpl.sections.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{tmpl.sections.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Runbook list */}
      <div className="text-sm text-muted-foreground">
        {loading ? 'Loading...' : `${filtered.length} runbook${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {filtered.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No runbooks yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your first runbook to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((rb) => {
            const docBadge = getDocTypeBadge(rb.template_id);
            const statusBadge = getStatusBadge(rb.status);
            return (
              <Card
                key={rb.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRunbook(rb)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <CardTitle className="text-base truncate">{rb.title}</CardTitle>
                    </div>
                    <Badge
                      className={cn('text-[10px] shrink-0', docBadge.className)}
                      variant="outline"
                    >
                      {docBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn('text-[10px]', statusBadge.className)}
                        variant="outline"
                      >
                        {statusBadge.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {rb.service_name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(rb.updated_at)}</span>
                      <span className="mx-1">|</span>
                      <span>v{rb.version}</span>
                    </div>
                    {rb.tags && rb.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3" />
                        {rb.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate Runbook Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Runbook</DialogTitle>
            <DialogDescription>
              Create a new auto-generated runbook for a service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Service Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. payment-service"
                value={genServiceName}
                onChange={(e) => setGenServiceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select value={genTemplateId} onValueChange={setGenTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Default template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {templates.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title (optional)</label>
              <Input
                placeholder="Auto-derived from service name"
                value={genTitle}
                onChange={(e) => setGenTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (optional)</label>
              <Input
                placeholder="Comma-separated tags"
                value={genTags}
                onChange={(e) => setGenTags(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!genServiceName.trim() || generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
