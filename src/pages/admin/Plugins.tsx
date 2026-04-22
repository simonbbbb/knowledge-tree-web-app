import { useState, useEffect } from 'react';
import { Puzzle, Settings, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PluginInfo {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  credential_types: string[];
  status: string;
}

export function Plugins() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    async function fetchPlugins() {
      try {
        const resp = await fetch('/api/v1/plugins/');
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        setPlugins(Array.isArray(json) ? json : json.data || []);
      } catch (err) {
        console.error('Failed to fetch plugins:', err);
        setPlugins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPlugins();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Plugins</h2>
          <p className="text-sm text-muted-foreground">Manage discovery and integration plugins.</p>
        </div>
        <Button variant="outline" disabled title="Plugin registry coming soon">
          <ExternalLink className="mr-2 h-4 w-4" />
          Plugin Registry
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No plugins loaded.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <Card key={plugin.name} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md',
                      plugin.status === 'loaded' ? 'bg-primary/10' : 'bg-muted',
                    )}>
                      <Puzzle className={cn('h-4 w-4', plugin.status === 'loaded' ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{plugin.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">v{plugin.version}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setConfigOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {plugin.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    className={cn(
                      'text-[10px]',
                      plugin.status === 'loaded' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    {plugin.status}
                  </Badge>
                  <div className="flex gap-1">
                    {plugin.capabilities?.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[9px]">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlugin?.name} Configuration</DialogTitle>
            <DialogDescription>
              v{selectedPlugin?.version} - {selectedPlugin?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedPlugin && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  className={cn(
                    'text-[10px]',
                    selectedPlugin.status === 'loaded' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                  )}
                  variant="outline"
                >
                  {selectedPlugin.status}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">Capabilities</span>
                <div className="flex flex-wrap gap-1">
                  {selectedPlugin.capabilities?.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                  ))}
                </div>
              </div>

              {selectedPlugin.credential_types && selectedPlugin.credential_types.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Credential Types</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedPlugin.credential_types.map((ct) => (
                      <Badge key={ct} variant="outline" className="text-xs">{ct}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
