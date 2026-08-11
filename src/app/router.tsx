import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/guards/ProtectedRoute';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ModulePlaceholder } from '@/shared/components/layout/ModulePlaceholder';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SetPasswordPage } from '@/features/auth/pages/SetPasswordPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<ModulePlaceholder title="Dashboard" />} />
          <Route path="analytics" element={<ModulePlaceholder title="Analytics" />} />
          <Route path="rbac/roles" element={<ModulePlaceholder title="Roles" />} />
          <Route path="rbac/permissions" element={<ModulePlaceholder title="Permissions" />} />
          <Route path="rbac/matrix" element={<ModulePlaceholder title="Permission matrix" />} />
          <Route path="rbac/users" element={<ModulePlaceholder title="Users" />} />
          <Route path="profile" element={<ModulePlaceholder title="Profile" />} />
          <Route path="settings/*" element={<ModulePlaceholder title="Settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
