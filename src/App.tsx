import { Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider, useAuthProvider } from '@/hooks/useAuth';
import { Dashboard } from '@/pages/Dashboard';
import { GraphExplorer } from '@/pages/GraphExplorer';
import { ResourceList } from '@/components/resources/ResourceList';
import { ResourceDetail } from '@/components/resources/ResourceDetail';
import { ServiceCatalog } from '@/pages/ServiceCatalog';
import { ServiceDetail } from '@/pages/ServiceDetail';
import { DocumentationBrowser } from '@/pages/DocumentationBrowser';
import { DocPage } from '@/pages/DocPage';
import { ChangeFeed } from '@/pages/ChangeFeed';
import { Reports } from '@/pages/Reports';
import { Discovery } from '@/pages/Discovery';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Scopes } from '@/pages/admin/Scopes';
import { Plugins } from '@/pages/admin/Plugins';
import { Credentials } from '@/pages/admin/Credentials';
import { Users } from '@/pages/admin/Users';
import { AIConfig } from '@/pages/admin/AIConfig';

function AppInner() {
  const auth = useAuthProvider();
  return (
    <AuthProvider value={auth}>
      <TooltipProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/graph" element={<GraphExplorer />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/services" element={<ServiceCatalog />} />
            <Route path="/services/:name" element={<ServiceDetail />} />
            <Route path="/docs" element={<DocumentationBrowser />} />
            <Route path="/docs/:path+" element={<DocPage />} />
            <Route path="/changes" element={<ChangeFeed />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Scopes />} />
              <Route path="scopes" element={<Scopes />} />
              <Route path="plugins" element={<Plugins />} />
              <Route path="credentials" element={<Credentials />} />
              <Route path="users" element={<Users />} />
              <Route path="ai" element={<AIConfig />} />
            </Route>
          </Route>
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}

function App() {
  return <AppInner />;
}

export default App;
