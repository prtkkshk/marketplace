import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthProvider';
import { ToastProvider } from './components/ui/Toast';
import { OfflineBanner } from './features/pwa/OfflineBanner';
import { PWAInstaller } from './features/pwa/PWAInstaller';
import { UpdateToast } from './features/pwa/UpdateToast';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';

import { SignInScreen } from './features/auth/SignInScreen';
import { SignUpScreen } from './features/auth/SignUpScreen';
import { OtpScreen } from './features/auth/OtpScreen';
import { ForgotPasswordScreen } from './features/auth/ForgotPasswordScreen';
import { CompleteProfileScreen } from './features/auth/CompleteProfileScreen';
import { BannedScreen } from './features/auth/BannedScreen';
import { ProtectedRoute, AdminRoute } from './features/auth/Guards';

const FeedScreen = lazy(() => import('./features/listings/FeedScreen').then(m => ({ default: m.FeedScreen })));
const ListingDetailScreen = lazy(() => import('./features/listings/ListingDetailScreen').then(m => ({ default: m.ListingDetailScreen })));
const CreateListingScreen = lazy(() => import('./features/listings/CreateListingScreen').then(m => ({ default: m.CreateListingScreen })));
const EditListingScreen = lazy(() => import('./features/listings/EditListingScreen').then(m => ({ default: m.EditListingScreen })));
const WantedBoardScreen = lazy(() => import('./features/wanted/WantedBoardScreen').then(m => ({ default: m.WantedBoardScreen })));
const CreateWantedRequestScreen = lazy(() => import('./features/wanted/CreateWantedRequestScreen').then(m => ({ default: m.CreateWantedRequestScreen })));
const RequestDetailScreen = lazy(() => import('./features/wanted/RequestDetailScreen').then(m => ({ default: m.RequestDetailScreen })));
const ProfileScreen = lazy(() => import('./features/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const SavedItemsScreen = lazy(() => import('./features/saved/SavedItemsScreen').then(m => ({ default: m.SavedItemsScreen })));
const RulesScreen = lazy(() => import('./routes/RulesScreen').then(m => ({ default: m.RulesScreen })));
const NotFoundScreen = lazy(() => import('./routes/NotFoundScreen').then(m => ({ default: m.NotFoundScreen })));
import { Spinner } from './components/ui/Spinner';

// Lazy-load admin route bundle so students do not download admin code
const AdminRoutes = lazy(() => import('./features/admin/AdminRoutes'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <OfflineBanner />
          <PWAInstaller />
          <UpdateToast />
          <BrowserRouter>
            <AuthProvider>
              <Suspense
                fallback={
                  <div className="p-8 flex items-center justify-center min-h-screen">
                    <Spinner size={32} />
                  </div>
                }
              >
                <Routes>
                  {/* Public Auth Routes */}
                <Route path="/auth/signin" element={<SignInScreen />} />
                <Route path="/auth/signup" element={<SignUpScreen />} />
                <Route path="/auth/otp" element={<OtpScreen />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordScreen />} />
                <Route path="/banned" element={<BannedScreen />} />
                <Route path="/complete-profile" element={<CompleteProfileScreen />} />

                {/* App Shell & Protected Student Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<FeedScreen />} />
                    <Route path="/wanted" element={<WantedBoardScreen />} />
                    <Route path="/new" element={<CreateListingScreen />} />
                    <Route path="/new-request" element={<CreateWantedRequestScreen />} />
                    <Route path="/listing/:id" element={<ListingDetailScreen />} />
                    <Route path="/listing/:id/edit" element={<EditListingScreen />} />
                    <Route path="/request/:id" element={<RequestDetailScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/profile/saved" element={<SavedItemsScreen />} />
                    <Route path="/rules" element={<RulesScreen />} />

                    {/* Admin Bundle (Lazy-loaded) */}
                    <Route element={<AdminRoute />}>
                      <Route
                        path="/admin/*"
                        element={
                          <AdminRoutes />
                        }
                      />
                    </Route>

                    {/* 404 Route inside shell */}
                    <Route path="*" element={<NotFoundScreen />} />
                  </Route>
                </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
