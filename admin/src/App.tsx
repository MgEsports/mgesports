import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/AdminLayout";

// Admin Pages
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { AdminTournamentsPage } from "./pages/AdminTournamentsPage";
import { AdminRegistrationsPage } from "./pages/AdminRegistrationsPage";
import { AdminPlayersPage } from "./pages/AdminPlayersPage";
import { AdminMerchandisePage } from "./pages/AdminMerchandisePage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { AdminNewsPage } from "./pages/AdminNewsPage";
import { AdminPartnersPage } from "./pages/AdminPartnersPage";
import { AdminMediaPage } from "./pages/AdminMediaPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";

import { AdminTournamentDetailPage } from "./pages/AdminTournamentDetailPage";
import { AdminVotingPage } from "./pages/AdminVotingPage";
import { AdminVotingDetailPage } from "./pages/AdminVotingDetailPage";

export const App: React.FC = () => {
  const basename = window.location.pathname.startsWith("/admin") ? "/admin" : "/";

  return (
    <BrowserRouter basename={basename}>
      <AdminAuthProvider>
        <Routes>
          {/* Authentication */}
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Console Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Direct root routes */}
            <Route index element={<AdminDashboardPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="tournaments" element={<AdminTournamentsPage />} />
            <Route path="tournaments/:tournamentId" element={<AdminTournamentDetailPage />} />
            <Route path="registrations" element={<AdminRegistrationsPage />} />
            <Route path="players" element={<AdminPlayersPage />} />
            <Route path="voting" element={<AdminVotingPage />} />
            <Route path="voting/:id" element={<AdminVotingDetailPage />} />
            <Route path="merchandise" element={<AdminMerchandisePage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="news" element={<AdminNewsPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />

            {/* /admin path aliases for flexible deployment sub-paths */}
            <Route path="admin">
              <Route index element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="tournaments" element={<AdminTournamentsPage />} />
              <Route path="tournaments/:tournamentId" element={<AdminTournamentDetailPage />} />
              <Route path="registrations" element={<AdminRegistrationsPage />} />
              <Route path="players" element={<AdminPlayersPage />} />
              <Route path="voting" element={<AdminVotingPage />} />
              <Route path="voting/:id" element={<AdminVotingDetailPage />} />
              <Route path="merchandise" element={<AdminMerchandisePage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="news" element={<AdminNewsPage />} />
              <Route path="partners" element={<AdminPartnersPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
