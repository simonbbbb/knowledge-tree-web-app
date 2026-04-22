import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  Server,
  Database,
  FileText,
  History,
  BarChart3,
  Settings,
  Target,
  Puzzle,
  Key,
  Users,
  Bot,
  Network,
} from 'lucide-react';
import {
  Sidebar as SidebarRoot,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarSection,
  SidebarSectionLabel,
} from '@/components/ui/sidebar';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const nav = (path: string) => () => navigate(path);

  return (
    <SidebarRoot
      collapsed={sidebarCollapsed}
      onCollapsedChange={toggleSidebarCollapsed}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-primary shrink-0" />
          {!sidebarCollapsed && (
            <span className="font-bold text-lg tracking-tight">
              Knowledge Tree
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection>
          <SidebarSectionLabel>Navigation</SidebarSectionLabel>
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={isActive('/')}
            onClick={nav('/')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<GitBranch className="h-5 w-5" />}
            label="Graph Explorer"
            active={isActive('/graph')}
            onClick={nav('/graph')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Database className="h-5 w-5" />}
            label="Resources"
            active={isActive('/resources')}
            onClick={nav('/resources')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Server className="h-5 w-5" />}
            label="Service Catalog"
            active={isActive('/services')}
            onClick={nav('/services')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Target className="h-5 w-5" />}
            label="Discovery"
            active={isActive('/discovery')}
            onClick={nav('/discovery')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<FileText className="h-5 w-5" />}
            label="Documentation"
            active={isActive('/docs')}
            onClick={nav('/docs')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<History className="h-5 w-5" />}
            label="Change Feed"
            active={isActive('/changes')}
            onClick={nav('/changes')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<BarChart3 className="h-5 w-5" />}
            label="Reports"
            active={isActive('/reports')}
            onClick={nav('/reports')}
            className="cursor-pointer"
          />
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionLabel>Administration</SidebarSectionLabel>
          <SidebarItem
            icon={<Settings className="h-5 w-5" />}
            label="Admin Console"
            active={isActive('/admin')}
            onClick={nav('/admin')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Target className="h-5 w-5" />}
            label="Scopes"
            active={isActive('/admin/scopes')}
            onClick={nav('/admin/scopes')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Puzzle className="h-5 w-5" />}
            label="Plugins"
            active={isActive('/admin/plugins')}
            onClick={nav('/admin/plugins')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Key className="h-5 w-5" />}
            label="Credentials"
            active={isActive('/admin/credentials')}
            onClick={nav('/admin/credentials')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label="Users & RBAC"
            active={isActive('/admin/users')}
            onClick={nav('/admin/users')}
            className="cursor-pointer"
          />
          <SidebarItem
            icon={<Bot className="h-5 w-5" />}
            label="AI Config"
            active={isActive('/admin/ai')}
            onClick={nav('/admin/ai')}
            className="cursor-pointer"
          />
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapsed}
          className="h-8 w-8"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarFooter>
    </SidebarRoot>
  );
}
