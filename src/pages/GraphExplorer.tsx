import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { TopologyGraph } from '@/components/graph/TopologyGraph';
import { GraphFilters } from '@/components/graph/GraphFilters';
import { NodeDetail } from '@/components/graph/NodeDetail';
import { GraphControls } from '@/components/graph/GraphControls';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGraphStore } from '@/lib/store';
import type { GraphNode, GraphEdge } from '@/lib/api';

// Map API resource types to graph node types
function mapNodeType(t: string): GraphNode['type'] {
  if (t.includes('deployment') || t.includes('service')) return 'service';
  if (t.includes('pod')) return 'infrastructure';
  if (t.includes('config_map') || t.includes('secret')) return 'storage';
  if (t.includes('ingress')) return 'infrastructure';
  if (t.includes('namespace')) return 'infrastructure';
  return 'infrastructure';
}

// Map API resource type to a display label for edges
function mapEdgeLabel(t: string): string {
  if (t === 'CONTAINS') return 'contains';
  if (t === 'DEPENDS_ON') return 'depends on';
  if (t === 'CALLS') return 'calls';
  return t.toLowerCase().replace('_', ' ');
}

export function GraphExplorer() {
  const { data, setData, selectedNode, isLoading, setLoading } = useGraphStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (data) return;
    setLoading(true);

    // Fetch topology data from the API
    async function fetchGraph() {
      try {
        const resp = await fetch('/api/v1/graph/topology/default');
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        const topology = json.data;

        // Convert topology nodes to GraphNode[]
        const nodes: GraphNode[] = (topology.nodes || []).map((n: Record<string, unknown>) => ({
          id: String(n.id || ''),
          label: String(n.name || n.id || ''),
          type: mapNodeType(String(n.type || '')),
          team: String(n.namespace || n.account_id || ''),
          environment: String(n.namespace || 'default'),
          health: 'healthy' as const,
          metadata: n as Record<string, unknown>,
        }));

        // Convert topology edges to GraphEdge[]
        const edges: GraphEdge[] = (topology.edges || []).map((e: Record<string, unknown>, i: number) => ({
          id: String(e.id || `e${i}`),
          source: String(e.source || ''),
          target: String(e.target || ''),
          label: mapEdgeLabel(String(e.type || '')),
          type: 'depends_on' as const,
        }));

        setData({ nodes, edges });
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
        // If topology fails, try the export endpoint
        try {
          const resp = await fetch('/api/v1/graph/export?format=json');
          if (!resp.ok) throw new Error(`Export API returned ${resp.status}`);
          const exportData = await resp.json();

          const nodes: GraphNode[] = (exportData.nodes || []).map((n: Record<string, unknown>) => ({
            id: String(n.id || ''),
            label: String(n.name || n.id || ''),
            type: mapNodeType(String(n.type || '')),
            team: String(n.namespace || n.account_id || ''),
            environment: String(n.namespace || 'default'),
            health: 'healthy' as const,
            metadata: n as Record<string, unknown>,
          }));

          const edges: GraphEdge[] = (exportData.edges || []).map((e: Record<string, unknown>, i: number) => ({
            id: `e${i}`,
            source: String(e.source || ''),
            target: String(e.target || ''),
            label: mapEdgeLabel(String(e.type || '')),
            type: 'depends_on' as const,
          }));

          setData({ nodes, edges });
        } catch (exportErr) {
          console.error('Failed to fetch export data:', exportErr);
          setData({ nodes: [], edges: [] });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
  }, [data, setData, setLoading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Graph Explorer</h1>
          <p className="text-muted-foreground">
            Visualize and explore your infrastructure topology.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GraphControls />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-14rem)] overflow-hidden">
        {/* Filter Sidebar */}
        {!isFullscreen && <GraphFilters />}

        {/* Graph */}
        <div className="flex-1 min-w-0 relative">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : (
            <TopologyGraph className="h-full w-full" />
          )}

          {/* Minimap placeholder */}
          <div className="absolute bottom-4 right-4 h-32 w-48 rounded border bg-card/80 backdrop-blur-sm p-2">
            <div className="text-[10px] text-muted-foreground text-center">Minimap</div>
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-xs text-muted-foreground/50">
                {data ? `${data.nodes.length} nodes, ${data.edges.length} edges` : 'No data'}
              </div>
            </div>
          </div>
        </div>

        {/* Node Detail Panel */}
        {selectedNode && !isFullscreen && <NodeDetail />}
      </div>
    </div>
  );
}
