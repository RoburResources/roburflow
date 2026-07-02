import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages
import Home from '@/pages/Home';
import Jobs from '@/pages/Jobs';
import JobForm from '@/pages/JobForm';
import JobDetail from '@/pages/JobDetail';
import Clients from '@/pages/Clients';
import Drivers from '@/pages/Drivers';
import Review from '@/pages/Review';
import ReviewDetail from '@/pages/ReviewDetail';
import Settlements from '@/pages/Settlements';
import DriverCapture from '@/pages/DriverCapture';
import DocumentArchive from '@/pages/DocumentArchive';
import ActivityLogs from '@/pages/ActivityLogs';
import QuickTemplates from '@/pages/QuickTemplates';
import SystemSettings from '@/pages/SystemSettings';
import PerformanceAnalytics from '@/pages/PerformanceAnalytics';
import InventoryAssets from '@/pages/InventoryAssets';
import IncidentReports from '@/pages/IncidentReports';
import ClientAccess from '@/pages/ClientAccess';
import MaintenanceSchedule from '@/pages/MaintenanceSchedule';
import FuelLogs from '@/pages/FuelLogs';
import DriverOnboarding from '@/pages/DriverOnboarding';
import DispatchCalendar from '@/pages/DispatchCalendar';
import AssetInventory from '@/pages/AssetInventory';
import SafetyBriefings from '@/pages/SafetyBriefings';
import ExpenseTracker from '@/pages/ExpenseTracker';
import DriverCertifications from '@/pages/DriverCertifications';
import MaintenanceAlerts from '@/pages/MaintenanceAlerts';
import ClientFeedback from '@/pages/ClientFeedback';
import KnowledgeLibrary from '@/pages/KnowledgeLibrary';
import ComplianceDashboard from '@/pages/ComplianceDashboard';
import DocumentVerification from '@/pages/DocumentVerification';
import ClientPortal from '@/pages/ClientPortal';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/new" element={<JobForm />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/jobs/:id/edit" element={<JobForm />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/review" element={<Review />} />
                <Route path="/review/:id" element={<ReviewDetail />} />
                <Route path="/settlements" element={<Settlements />} />
                <Route path="/document-archive" element={<DocumentArchive />} />
                <Route path="/activity-logs" element={<ActivityLogs />} />
                <Route path="/quick-templates" element={<QuickTemplates />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/performance-analytics" element={<PerformanceAnalytics />} />
                <Route path="/inventory-assets" element={<InventoryAssets />} />
                <Route path="/incident-reports" element={<IncidentReports />} />
                <Route path="/client-access" element={<ClientAccess />} />
                <Route path="/maintenance-schedule" element={<MaintenanceSchedule />} />
                <Route path="/fuel-logs" element={<FuelLogs />} />
                <Route path="/driver-onboarding" element={<DriverOnboarding />} />
                <Route path="/dispatch-calendar" element={<DispatchCalendar />} />
                <Route path="/asset-inventory" element={<AssetInventory />} />
                <Route path="/service-templates" element={<QuickTemplates />} />
                {/* New feature pages */}
                <Route path="/safety-briefings" element={<SafetyBriefings />} />
                <Route path="/expense-tracker" element={<ExpenseTracker />} />
                <Route path="/driver-certifications" element={<DriverCertifications />} />
                <Route path="/maintenance-alerts" element={<MaintenanceAlerts />} />
                <Route path="/client-feedback" element={<ClientFeedback />} />
                <Route path="/incident-reporting" element={<IncidentReports />} />
                <Route path="/quick-references" element={<KnowledgeLibrary title="Quick References" subtitle="Safety procedures, company policies and instructional guides." />} />
                <Route path="/resource-library" element={<KnowledgeLibrary title="Resource Library" subtitle="Company policies, manuals and standard operating procedures." />} />
                <Route path="/fleet-overview" element={<AssetInventory />} />
                <Route path="/document-verification" element={<DocumentVerification />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                {/* Driver capture flow */}
                <Route path="/job/:id" element={<DriverCapture />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App