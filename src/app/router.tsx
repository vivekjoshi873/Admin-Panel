import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { AppShell } from '@/shared/components/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SetPasswordPage } from '@/features/auth/pages/SetPasswordPage';
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage';
import { RolesPage } from '@/features/rbac/pages/RolesPage';
import { PermissionsPage } from '@/features/rbac/pages/PermissionsPage';
import { PermissionMatrixPage } from '@/features/rbac/pages/PermissionMatrixPage';
import { UsersPage } from '@/features/rbac/pages/UsersPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { SettingsRoutes } from '@/features/settings/pages/SettingsRoutes';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="rbac/roles" element={<RolesPage />} />
          <Route path="rbac/permissions" element={<PermissionsPage />} />
          <Route path="rbac/matrix" element={<PermissionMatrixPage />} />
          <Route path="rbac/users" element={<UsersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings/*" element={<SettingsRoutes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
