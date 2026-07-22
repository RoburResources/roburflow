import { lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import Layout from '@/components/Layout';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages (lazy-loaded for performance)
const Home = lazy(() => import('@/pages/Home'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const JobForm = lazy(() => import('@/pages/JobForm'));
const JobDetail = lazy(() => import('@/pages/JobDetail'));
const Clients = lazy(() => import('@/pages/Clients'));
const Drivers = lazy(() => import('@/pages/Drivers'));
const Review = lazy(() => import('@/pages/Review'));
const ReviewDetail = lazy(() => import('@/pages/ReviewDetail'));
const Settlements = lazy(() => import('@/pages/Settlements'));
const DriverCapture = lazy(() => import('@/pages/DriverCapture'));
const DocumentArchive = lazy(() => import('@/pages/DocumentArchive'));
const ActivityLogs = lazy(() => import('@/pages/ActivityLogs'));
const QuickTemplates = lazy(() => import('@/pages/QuickTemplates'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));
const PerformanceAnalytics = lazy(() => import('@/pages/PerformanceAnalytics'));
const InventoryAssets = lazy(() => import('@/pages/InventoryAssets'));
const IncidentReports = lazy(() => import('@/pages/IncidentReports'));
const ClientAccess = lazy(() => import('@/pages/ClientAccess'));
const MaintenanceSchedule = lazy(() => import('@/pages/MaintenanceSchedule'));
const FuelLogs = lazy(() => import('@/pages/FuelLogs'));
const DriverOnboarding = lazy(() => import('@/pages/DriverOnboarding'));
const DispatchCalendar = lazy(() => import('@/pages/DispatchCalendar'));
const AssetInventory = lazy(() => import('@/pages/AssetInventory'));
const SafetyBriefings = lazy(() => import('@/pages/SafetyBriefings'));
const ExpenseTracker = lazy(() => import('@/pages/ExpenseTracker'));
const DriverCertifications = lazy(() => import('@/pages/DriverCertifications'));
const MaintenanceAlerts = lazy(() => import('@/pages/MaintenanceAlerts'));
const ClientFeedback = lazy(() => import('@/pages/ClientFeedback'));
const KnowledgeLibrary = lazy(() => import('@/pages/KnowledgeLibrary'));
const ComplianceDashboard = lazy(() => import('@/pages/ComplianceDashboard'));
const DocumentVerification = lazy(() => import('@/pages/DocumentVerification'));
const ClientPortal = lazy(() => import('@/pages/ClientPortal'));
const ScanDocuments = lazy(() => import('@/pages/ScanDocuments'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-robur-gold/30 border-t-robur-gold rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                  <Route element={<Layout />}>
                    {/* ---- Shared / driver-accessible routes ---- */}
                    <Route path="/" element={<Home />} />
                    {/* Driver capture flow */}
                    <Route path="/job/:id" element={<DriverCapture />} />
                    {/* Staff & driver self-service */}
                    <Route path="/safety-briefings" element={<SafetyBriefings />} />
                    <Route path="/expense-tracker" element={<ExpenseTracker />} />
                    <Route path="/incident-reporting" element={<IncidentReports />} />
                    <Route path="/quick-references" element={<KnowledgeLibrary title="Quick References" subtitle="Safety procedures, company policies and instructional guides." />} />

                    {/* ---- Admin-only routes ---- */}
                    <Route element={<RoleRoute />}>
                      <Route path="/scan-documents" element={<ScanDocuments />} />
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
                      <Route path="/driver-certifications" element={<DriverCertifications />} />
                      <Route path="/maintenance-alerts" element={<MaintenanceAlerts />} />
                      <Route path="/client-feedback" element={<ClientFeedback />} />
                      <Route path="/resource-library" element={<KnowledgeLibrary title="Resource Library" subtitle="Company policies, manuals and standard operating procedures." />} />
                      <Route path="/fleet-overview" element={<AssetInventory />} />
                      <Route path="/document-verification" element={<DocumentVerification />} />
                      <Route path="/document-verification/:jobId" element={<DocumentVerification />} />
                      <Route path="/client-portal" element={<ClientPortal />} />
                      <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App