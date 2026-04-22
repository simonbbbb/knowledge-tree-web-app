import { ZoomIn, ZoomOut, Maximize, RotateCcw, LayoutGrid, GitBranch, Circle, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useGraphStore } from '@/lib/store';
import type { GraphLayout } from '@/lib/store';

const LAYOUT_OPTIONS: Array<{ value: GraphLayout; icon: React.ReactNode; label: string }> = [
  { value: 'force-directed', icon: <GitBranch className="h-4 w-4" />, label: 'Force Directed' },
  { value: 'hierarchical', icon: <LayoutGrid className="h-4 w-4" />, label: 'Hierarchical' },
  { value: 'concentric', icon: <Circle className="h-4 w-4" />, label: 'Concentric' },
  { value: 'grid', icon: <Grid3x3 className="h-4 w-4" />, label: 'Grid' },
];

export function GraphControls() {
  const { layout, setLayout } = useGraphStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
      {LAYOUT_OPTIONS.map((opt) => (
        <Tooltip key={opt.value}>
          <TooltipTrigger asChild>
            <Button
              variant={layout === opt.value ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLayout(opt.value)}
            >
              {opt.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{opt.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fit to View</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset Layout</TooltipContent>
      </Tooltip>
    </div>
  );
}
