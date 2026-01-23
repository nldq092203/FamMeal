import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { FamilyProvider } from '@/context/FamilyContext'
import { ToastProvider } from '@/context/ToastContext'
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute/PublicOnlyRoute'
import { FamilyGate } from '@/components/FamilyGate/FamilyGate'

import Layout from '@/components/Layout/Layout'
import LoginPage from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import FamilySelectPage from '@/pages/FamilySelect/FamilySelectPage'
import MealsPage from '@/pages/Meals/MealsPage'
import MealDetailPage from '@/pages/Meals/MealDetailPage'
import ProposalDetailPage from '@/pages/Proposals/ProposalDetailPage'
import HistoryPage from '@/pages/History/HistoryPage'
import FamilyPage from '@/pages/Family/FamilyPage'
import SettingsPage from '@/pages/Settings/SettingsPage'
import EditProfilePage from '@/pages/Settings/EditProfilePage'
import ChangePasswordPage from '@/pages/Settings/ChangePasswordPage'
import SettingsNotificationsPage from '@/pages/Settings/NotificationsPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <FamilyProvider>
                    <FamilyGate />
                  </FamilyProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/family-select" element={<FamilySelectPage />} />
              
              {/* Detail pages without bottom nav */}
              <Route path="/meals/:id" element={<MealDetailPage />} />
              <Route path="/proposals/:id" element={<ProposalDetailPage />} />
              
              {/* Main app with tab navigation */}
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/meals" replace />} />
                <Route path="/meals" element={<MealsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/edit-profile" element={<EditProfilePage />} />
              <Route path="/settings/change-password" element={<ChangePasswordPage />} />
              <Route path="/settings/notifications" element={<SettingsNotificationsPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
