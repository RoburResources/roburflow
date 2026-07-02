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