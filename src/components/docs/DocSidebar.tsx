import { ChevronRight, File, Folder } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DocTreeItem } from '@/lib/api';

interface DocSidebarProps {
  tree: DocTreeItem[];
  activePath?: string;
  onSelect: (path: string) => void;
}

export function DocSidebar({ tree, activePath, onSelect }: DocSidebarProps) {
  return (
    <div className="w-64 rounded-lg border bg-card p-2">
      <h3 className="font-semibold text-sm px-2 py-2">Documentation</h3>
      <div className="space-y-0.5">
        {tree.map((item) => (
          <DocTreeItemComponent
            key={item.path}
            item={item}
            activePath={activePath}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

interface DocTreeItemComponentProps {
  item: DocTreeItem;
  activePath?: string;
  onSelect: (path: string) => void;
  depth: number;
}

function DocTreeItemComponent({ item, activePath, onSelect, depth }: DocTreeItemComponentProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDirectory = item.type === 'directory';
  const isActive = item.path === activePath;

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors',
          isActive && 'bg-accent font-medium',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isDirectory) {
            setExpanded(!expanded);
          } else {
            onSelect(item.path);
          }
        }}
      >
        {isDirectory ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform',
              expanded && 'rotate-90',
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isDirectory ? (
          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{item.name}</span>
      </button>

      {isDirectory && expanded && item.children && (
        <div>
          {item.children.map((child) => (
            <DocTreeItemComponent
              key={child.path}
              item={child}
              activePath={activePath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
