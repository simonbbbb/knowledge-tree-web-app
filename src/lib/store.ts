import { create } from 'zustand';
import type { DiscoveryRun, GraphData, GraphNode } from './api';

// ─── Discovery Store ────────────────────────────────────────────────────────

interface DiscoveryState {
  runs: DiscoveryRun[];
  currentRun: DiscoveryRun | null;
  isLoading: boolean;
  setRuns: (runs: DiscoveryRun[]) => void;
  setCurrentRun: (run: DiscoveryRun | null) => void;
  setLoading: (loading: boolean) => void;
  addRun: (run: DiscoveryRun) => void;
  updateRun: (id: string, updates: Partial<DiscoveryRun>) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  runs: [],
  currentRun: null,
  isLoading: false,
  setRuns: (runs) => set({ runs }),
  setCurrentRun: (currentRun) => set({ currentRun }),
  setLoading: (isLoading) => set({ isLoading }),
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  updateRun: (id, updates) =>
    set((state) => ({
      runs: state.runs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      currentRun:
        state.currentRun?.id === id
          ? { ...state.currentRun, ...updates }
          : state.currentRun,
    })),
}));

// ─── Graph Store ────────────────────────────────────────────────────────────

interface GraphFilters {
  team: string | null;
  type: string | null;
  environment: string | null;
  depth: number;
  search: string;
}

export type GraphLayout = 'force-directed' | 'hierarchical' | 'concentric' | 'grid';

interface GraphState {
  data: GraphData | null;
  selectedNode: GraphNode | null;
  filters: GraphFilters;
  layout: GraphLayout;
  isLoading: boolean;
  setData: (data: GraphData | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setFilters: (filters: Partial<GraphFilters>) => void;
  resetFilters: () => void;
  setLayout: (layout: GraphLayout) => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: GraphFilters = {
  team: null,
  type: null,
  environment: null,
  depth: 3,
  search: '',
};

export const useGraphStore = create<GraphState>((set) => ({
  data: null,
  selectedNode: null,
  filters: { ...defaultFilters },
  layout: 'force-directed',
  isLoading: false,
  setData: (data) => set({ data }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setLayout: (layout) => set({ layout }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── UI Store ───────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  chatPanelOpen: boolean;
  searchQuery: string;
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: string }>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][number], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: (localStorage.getItem('kt-theme') as 'light' | 'dark' | 'system') || 'system',
  chatPanelOpen: false,
  searchQuery: '',
  notifications: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => {
    localStorage.setItem('kt-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme });
  },
  toggleChatPanel: () =>
    set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
  setChatPanelOpen: (chatPanelOpen) => set({ chatPanelOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
