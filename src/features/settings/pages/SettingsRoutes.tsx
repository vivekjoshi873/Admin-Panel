import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsCategoriesPage } from './SettingsCategoriesPage';
import { SettingsGroupPage } from './SettingsGroupPage';

export function SettingsRoutes() {
  return (
    <Routes>
      <Route index element={<SettingsCategoriesPage />} />
      <Route path="group/:slug" element={<SettingsGroupPage />} />
      <Route path="*" element={<Navigate to="/settings" replace />} />
    </Routes>
  );
}
