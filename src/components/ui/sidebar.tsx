import * as React from 'react';
import { cn } from '@/lib/utils';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

function useSidebar() {
  return React.useContext(SidebarContext);
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: string;
  collapsedWidth?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, collapsed = false, onCollapsedChange, width = '16rem', collapsedWidth = '4rem', ...props }, ref) => (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: (c) => onCollapsedChange?.(c) }}>
      <aside
        ref={ref}
        className={cn(
          'flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
          className,
        )}
        style={{ width: collapsed ? collapsedWidth : width }}
        {...props}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  ),
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center border-b border-sidebar-border p-4', className)} {...props} />
  ),
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto p-2 scrollbar-thin', className)} {...props} />
  ),
);
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('border-t border-sidebar-border p-4', className)} {...props} />
  ),
);
SidebarFooter.displayName = 'SidebarFooter';

interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  active?: boolean;
  label: string;
}

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, icon, active, label, ...props }, ref) => {
    const { collapsed } = useSidebar();
    return (
      <a
        ref={ref}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent/20',
          active && 'bg-sidebar-accent/20 text-sidebar-accent',
          collapsed && 'justify-center px-2',
          className,
        )}
        title={collapsed ? label : undefined}
        {...props}
      >
        {icon && <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>}
        {!collapsed && <span className="truncate">{label}</span>}
      </a>
    );
  },
);
SidebarItem.displayName = 'SidebarItem';

const SidebarSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-2', className)} {...props} />
  ),
);
SidebarSection.displayName = 'SidebarSection';

const SidebarSectionLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar();
    if (collapsed) return null;
    return (
      <div
        ref={ref}
        className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50', className)}
        {...props}
      />
    );
  },
);
SidebarSectionLabel.displayName = 'SidebarSectionLabel';

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarSection,
  SidebarSectionLabel,
  useSidebar,
};
