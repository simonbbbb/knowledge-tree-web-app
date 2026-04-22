import { useEffect, useRef, useCallback } from 'react';
import cytoscape, { type Core, type EventObject } from 'cytoscape';
import { useGraphStore } from '@/lib/store';
import type { GraphNode } from '@/lib/api';
import { cn } from '@/lib/utils';

const NODE_COLORS: Record<string, string> = {
  service: '#3b82f6',
  database: '#8b5cf6',
  queue: '#f59e0b',
  cache: '#ef4444',
  storage: '#10b981',
  external: '#6b7280',
  infrastructure: '#06b6d4',
};

const LAYOUTS: Record<string, cytoscape.LayoutOptions> = {
  'force-directed': {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeRepulsion: () => 80000,
    idealEdgeLength: () => 100,
    gravity: 0.25,
    padding: 30,
  } as cytoscape.LayoutOptions,
  hierarchical: {
    name: 'breadthfirst',
    animate: true,
    animationDuration: 500,
    spacingFactor: 1.5,
    padding: 30,
  } as cytoscape.LayoutOptions,
  concentric: {
    name: 'concentric',
    animate: true,
    animationDuration: 500,
    concentric: (node: cytoscape.NodeSingular) => node.degree(),
    padding: 30,
  } as cytoscape.LayoutOptions,
  grid: {
    name: 'grid',
    animate: true,
    animationDuration: 500,
    padding: 30,
  } as cytoscape.LayoutOptions,
};

interface TopologyGraphProps {
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
}

export function TopologyGraph({ className, onNodeClick }: TopologyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { data, filters, layout, selectedNode, setSelectedNode } = useGraphStore();

  const handleNodeClick = useCallback(
    (event: EventObject) => {
      const node = event.target;
      const nodeData: GraphNode = {
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        team: node.data('team'),
        environment: node.data('environment'),
        health: node.data('health'),
        metadata: node.data('metadata'),
      };
      setSelectedNode(nodeData);
      onNodeClick?.(nodeData);
    },
    [setSelectedNode, onNodeClick],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => NODE_COLORS[ele.data('type')] || '#6b7280',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'text-outline-color': '#fff',
            'text-outline-width': '2px',
            width: 40,
            height: 40,
            'border-width': 2,
            'border-color': '#fff',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#3b82f6',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#d1d5db',
            'target-arrow-color': '#d1d5db',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            label: 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-outline-color': '#fff',
            'text-outline-width': '1px',
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
          },
        },
      ],
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on('tap', 'node', handleNodeClick);
    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  // Update data
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !data) return;

    cy.elements().remove();

    // Apply filters to nodes
    const filteredNodes = data.nodes.filter((n) => {
      if (filters.search && !n.label.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.type && n.type !== filters.type) return false;
      if (filters.team && n.team !== filters.team) return false;
      if (filters.environment && n.environment !== filters.environment) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const nodes = filteredNodes.map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        team: n.team,
        environment: n.environment,
        health: n.health,
        metadata: n.metadata,
      },
    }));

    // Only include edges where both endpoints are visible
    const edges = data.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || e.type,
        },
      }));

    cy.add([...nodes, ...edges]);
    cy.layout(LAYOUTS[layout] || LAYOUTS['force-directed']).run();
  }, [data, filters, layout]);

  // Update selection + resize graph when panel opens/closes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Wait for DOM to update, then resize cytoscape to fit new container
    requestAnimationFrame(() => {
      cy.resize();
      cy.fit(undefined, 30);
    });

    cy.elements().removeClass('highlighted');
    if (selectedNode) {
      const node = cy.getElementById(selectedNode.id);
      node.addClass('highlighted');
    }
  }, [selectedNode]);

  return (
    <div
      ref={containerRef}
      className={cn('graph-container rounded-lg border bg-card', className)}
    />
  );
}
