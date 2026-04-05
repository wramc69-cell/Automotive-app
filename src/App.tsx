import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import { GlobalLayout } from './layouts/GlobalLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { TechLayout } from './layouts/TechLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthGuard, RoleGuard, PublicGuard } from './components/guards/RouteGuards';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage';

// Customer Pages
import { CustomerDashboardPage } from './pages/customer/DashboardPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { VehiclesPage } from './pages/customer/VehiclesPage';
import { SchedulePage } from './pages/customer/SchedulePage';
import { RequestsPage as CustomerRequestsPage } from './pages/customer/RequestsPage';
import { RequestDetailPage as CustomerRequestDetailPage } from './pages/customer/RequestDetailPage';
import { ChatbotPage } from './pages/customer/ChatbotPage';
import { OnboardingPage } from './pages/customer/OnboardingPage';

// Tech Pages
import { TechDashboardPage } from './pages/tech/DashboardPage';
import { TechRequestsPage } from './pages/tech/RequestsPage';
import { TechRequestDetailPage } from './pages/tech/RequestDetailPage';
import { TechProfilePage } from './pages/tech/ProfilePage';
import { TechHistoryPage } from './pages/tech/HistoryPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminRequestsPage, AdminTechsPage, AdminCatalogPage, AdminConfigPage, AdminRequestDetailPage, AdminNotificationsPage, AdminAdminsPage } from './pages/admin/AdminPages';
import { AdminChecklistTemplatesPage } from './pages/admin/AdminChecklistTemplatesPage';
import { AdminTemplateRulesPage } from './pages/admin/AdminTemplateRulesPage';

function App() {
  return (
    <Router>
      <Routes>

        {/* Global Layout (Includes Header/Footer) */}
        <Route element={<GlobalLayout />}>

          {/* Public Routes */}
          <Route element={<PublicGuard />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
          </Route>

          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

          {/* Protected Routes (Needs Auth) */}
          <Route element={<AuthGuard />}>

            {/* Onboarding Logic */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Customer Routes */}
            <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
              <Route path="/app" element={<CustomerLayout />}>
                <Route index element={<CustomerDashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="chat" element={<ChatbotPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="requests" element={<CustomerRequestsPage />} />
                <Route path="requests/:id" element={<CustomerRequestDetailPage />} />
              </Route>
            </Route>

            {/* Technician Routes */}
            <Route element={<RoleGuard allowedRoles={['TECH']} />}>
              <Route path="/tech" element={<TechLayout />}>
                <Route index element={<TechDashboardPage />} />
                <Route path="requests" element={<TechRequestsPage />} />
                <Route path="requests/:id" element={<TechRequestDetailPage />} />
                <Route path="history" element={<TechHistoryPage />} />
                <Route path="profile" element={<TechProfilePage />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="catalog" element={<AdminCatalogPage />} />
                <Route path="techs" element={<AdminTechsPage />} />
                <Route path="admins" element={<AdminAdminsPage />} />
                <Route path="config" element={<AdminConfigPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="requests/:id" element={<AdminRequestDetailPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="checklist-templates" element={<AdminChecklistTemplatesPage />} />
                <Route path="template-rules" element={<AdminTemplateRulesPage />} />
              </Route>
            </Route>

          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
