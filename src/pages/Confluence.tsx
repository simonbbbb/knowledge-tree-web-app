import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Clock,
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatRelativeTime, getStatusBg } from '@/lib/utils';
import type { ConfluenceConnection, ConfluencePage, ImportStatus } from '@/lib/api';
import { api } from '@/lib/api';

export function Confluence() {
  // Connection state
  const [connections, setConnections] = useState<ConfluenceConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [creatingConnection, setCreatingConnection] = useState(false);

  // Connection form
  const [connName, setConnName] = useState('');
  const [connUrl, setConnUrl] = useState('');
  const [connUsername, setConnUsername] = useState('');
  const [connToken, setConnToken] = useState('');
  const [connSpaceKey, setConnSpaceKey] = useState('');

  // Import state
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [importing, setImporting] = useState(false);
  const [activeImport, setActiveImport] = useState<ImportStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConfluencePage[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchConnectionId, setSearchConnectionId] = useState('');

  const fetchConnections = useCallback(async () => {
    try {
      const data = await api.confluence.listConnections();
      setConnections(data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Auto-select first connection
  useEffect(() => {
    if (connections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connections[0].id);
      setSearchConnectionId(connections[0].id);
    }
  }, [connections, selectedConnectionId]);

  // Poll import status
  useEffect(() => {
    if (activeImport && (activeImport.status === 'pending' || activeImport.status === 'running')) {
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.confluence.getImportStatus(activeImport.id);
          setActiveImport(status);
          if (status.status === 'completed' || status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 2000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeImport?.id, activeImport?.status]);

  const handleCreateConnection = async () => {
    if (!connName.trim() || !connUrl.trim() || !connSpaceKey.trim()) return;
    setCreatingConnection(true);
    try {
      await api.confluence.createConnection({
        name: connName,
        base_url: connUrl,
        space_key: connSpaceKey,
        username: connUsername,
        token: connToken,
      });
      setShowConnectionDialog(false);
      setConnName('');
      setConnUrl('');
      setConnUsername('');
      setConnToken('');
      setConnSpaceKey('');
      await fetchConnections();
    } catch (err) {
      console.error('Failed to create connection:', err);
    } finally {
      setCreatingConnection(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await api.confluence.deleteConnection(id);
      if (selectedConnectionId === id) setSelectedConnectionId('');
      if (searchConnectionId === id) setSearchConnectionId('');
      await fetchConnections();
    } catch (err) {
      console.error('Failed to delete connection:', err);
    }
  };

  const handleImportSpace = async () => {
    if (!selectedConnectionId) return;
    setImporting(true);
    try {
      const status = await api.confluence.importSpace(selectedConnectionId);
      setActiveImport(status);
    } catch (err) {
      console.error('Failed to start import:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchConnectionId || !searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.confluence.searchPages(searchConnectionId, searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Failed to search pages:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getImportProgress = (imp: ImportStatus) => {
    if (imp.total_pages === 0) return 0;
    return Math.round((imp.imported_pages / imp.total_pages) * 100);
  };

  const getImportStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Complete', className: getStatusBg('success'), icon: CheckCircle2 };
      case 'failed':
        return { label: 'Failed', className: getStatusBg('failed'), icon: AlertCircle };
      case 'running':
        return { label: 'Running', className: getStatusBg('running'), icon: Loader2 };
      default:
        return { label: 'Pending', className: getStatusBg('pending'), icon: Clock };
    }
  };

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Confluence Import</h1>
          <p className="text-muted-foreground">
            Import and browse pages from Confluence spaces.
          </p>
        </div>
        <Button onClick={() => setShowConnectionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Connection
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {loadingConnections ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading connections...</div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No Confluence connections configured.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a connection to start importing pages.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((conn) => (
                <Card key={conn.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-base truncate">{conn.name}</CardTitle>
                      </div>
                      <Badge
                        className={cn('text-[10px] shrink-0', getStatusBg(conn.status))}
                        variant="outline"
                      >
                        {conn.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <p className="text-xs truncate">{conn.base_url}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {conn.space_key}
                        </Badge>
                        <span className="text-xs">{conn.username}</span>
                      </div>
                      <p className="text-xs">Created {formatRelativeTime(conn.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteConnection(conn.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import from Confluence</CardTitle>
              <CardDescription>
                Select a connection and import all pages from a Confluence space.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Connection</label>
                  <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.space_key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleImportSpace}
                  disabled={!selectedConnectionId || importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Import Space
                </Button>
              </div>

              {selectedConnection && (
                <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
                  <p>
                    <span className="font-medium">URL:</span>{' '}
                    {selectedConnection.base_url}
                  </p>
                  <p>
                    <span className="font-medium">Space:</span>{' '}
                    {selectedConnection.space_key}
                  </p>
                  <p>
                    <span className="font-medium">User:</span>{' '}
                    {selectedConnection.username}
                  </p>
                </div>
              )}

              {/* Import progress */}
              {activeImport && (
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = getImportStatusBadge(activeImport.status);
                        const Icon = badge.icon;
                        return (
                          <>
                            <Badge className={cn('text-[10px]', badge.className)} variant="outline">
                              {badge.label}
                            </Badge>
                            {activeImport.status === 'running' && (
                              <Icon className="h-3 w-3 animate-spin" />
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const status = await api.confluence.getImportStatus(activeImport.id);
                          setActiveImport(status);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>

                  {(activeImport.status === 'running' || activeImport.status === 'pending') && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {activeImport.imported_pages} / {activeImport.total_pages} pages
                        </span>
                        <span>{getImportProgress(activeImport)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${getImportProgress(activeImport)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {activeImport.status === 'failed' && activeImport.error && (
                    <p className="text-sm text-destructive">{activeImport.error}</p>
                  )}

                  {activeImport.status === 'completed' && (
                    <p className="text-sm text-muted-foreground">
                      Successfully imported {activeImport.imported_pages} pages.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Import ID: {activeImport.id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Imported Pages</CardTitle>
              <CardDescription>
                Search pages imported from Confluence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="w-[250px] space-y-2">
                  <label className="text-sm font-medium">Connection</label>
                  <Select value={searchConnectionId} onValueChange={setSearchConnectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pages..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchConnectionId || !searchQuery.trim() || searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
              )}

              {searchResults.length === 0 && searching && (
                <p className="text-sm text-muted-foreground py-4 text-center">Searching...</p>
              )}

              {searchResults.length === 0 && !searching && searchQuery && searchConnectionId && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No pages found. Try a different search term.
                </p>
              )}

              <div className="divide-y">
                {searchResults.map((page) => (
                  <div key={page.id} className="flex items-start gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{page.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px]">
                          {page.space_key}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {page.status}
                        </Badge>
                        <span>v{page.version}</span>
                        <span>|</span>
                        <span>{formatRelativeTime(page.last_updated)}</span>
                      </div>
                    </div>
                    {page.url && (
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Confluence Connection</DialogTitle>
            <DialogDescription>
              Configure a connection to your Confluence instance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Engineering Wiki"
                value={connName}
                onChange={(e) => setConnName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Base URL <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="https://your-instance.atlassian.net/wiki"
                value={connUrl}
                onChange={(e) => setConnUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Space Key <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. ENG"
                value={connSpaceKey}
                onChange={(e) => setConnSpaceKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="user@example.com"
                value={connUsername}
                onChange={(e) => setConnUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Token / PAT</label>
              <Input
                type="password"
                placeholder="API token or personal access token"
                value={connToken}
                onChange={(e) => setConnToken(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateConnection}
              disabled={!connName.trim() || !connUrl.trim() || !connSpaceKey.trim() || creatingConnection}
            >
              {creatingConnection ? 'Creating...' : 'Create Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
