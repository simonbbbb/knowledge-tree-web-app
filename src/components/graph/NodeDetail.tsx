import { X, Server, Database, Cloud, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGraphStore } from '@/lib/store';
import { cn, getStatusBg } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  service: <Server className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  queue: <Layers className="h-4 w-4" />,
  cache: <Cloud className="h-4 w-4" />,
  storage: <Cloud className="h-4 w-4" />,
  infrastructure: <Layers className="h-4 w-4" />,
};

function MetaRow({ k, v }: { k: string; v: unknown }) {
  const str = String(v);
  if (str === '' || str === '<nil>' || str === 'undefined') return null;
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap align-top font-medium">
        {k}
      </td>
      <td className="py-1.5 text-xs font-mono break-all leading-relaxed">
        {str.length > 200 ? str.slice(0, 200) + '...' : str}
      </td>
    </tr>
  );
}

export function NodeDetail() {
  const { selectedNode, setSelectedNode } = useGraphStore();

  if (!selectedNode) return null;

  const meta = selectedNode.metadata || {};
  const metaEntries = Object.entries(meta).filter(
    ([k, v]) => k !== '_raw' && v != null && String(v) !== ''
  );

  return (
    <div className="w-[22rem] min-w-0 shrink-0 rounded-lg border bg-card shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {TYPE_ICONS[selectedNode.type] || <Server className="h-4 w-4 shrink-0" />}
          <h3 className="font-semibold truncate">{selectedNode.label}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setSelectedNode(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Scrollable body */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Type</span>
              <p className="font-medium capitalize">{selectedNode.type}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Health</span>
              <div>
                <Badge className={cn('mt-0.5', getStatusBg(selectedNode.health))} variant="outline">
                  {selectedNode.health}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Namespace</span>
              <p className="font-medium truncate">{selectedNode.team || selectedNode.environment}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Environment</span>
              <p className="font-medium capitalize">{selectedNode.environment}</p>
            </div>
          </div>

          <Separator />

          {/* ID */}
          <div>
            <span className="text-xs text-muted-foreground font-medium">Node ID</span>
            <p className="text-[11px] font-mono bg-muted rounded px-2 py-1.5 mt-1 break-all select-all">
              {selectedNode.id}
            </p>
          </div>

          {/* Metadata table */}
          {metaEntries.length > 0 && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground font-medium">
                  Metadata ({metaEntries.length})
                </span>
                <table className="w-full mt-1.5">
                  <tbody>
                    {metaEntries.map(([k, v]) => (
                      <MetaRow key={k} k={k} v={v} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
