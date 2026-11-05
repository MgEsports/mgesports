import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { CustomCursor } from "./components/common/CustomCursor";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { Navbar } from "./components/navbar/Navbar";
import { FooterSection } from "./sections/FooterSection";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";

// Eager HomePage for fastest initial render & LCP
import { HomePage } from "./pages/HomePage";

// Code-split secondary routes for Core Web Vitals optimization
const TournamentsPage = lazy(() => import("./pages/TournamentsPage").then((m) => ({ default: m.TournamentsPage })));
const TournamentDetailPage = lazy(() => import("./pages/TournamentDetailPage").then((m) => ({ default: m.TournamentDetailPage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const NewsPage = lazy(() => import("./pages/NewsPage").then((m) => ({ default: m.NewsPage })));
const MediaPage = lazy(() => import("./pages/MediaPage").then((m) => ({ default: m.MediaPage })));
const CommunityPage = lazy(() => import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })));
const BrandPartnersPage = lazy(() => import("./pages/BrandPartnersPage").then((m) => ({ default: m.BrandPartnersPage })));
const PartnersPage = lazy(() => import("./pages/PartnersPage").then((m) => ({ default: m.PartnersPage })));
const MyTournamentsPage = lazy(() => import("./pages/MyTournamentsPage").then((m) => ({ default: m.MyTournamentsPage })));
const VotingPage = lazy(() => import("./pages/VotingPage").then((m) => ({ default: m.VotingPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const AdminPortalRoutes = lazy(() => import("../admin/src/AdminPortalRoutes").then((m) => ({ default: m.AdminPortalRoutes })));

/**
 * Public Layout with Lordz Header, Loading, Cursor, and Footer
 */
function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#FFBE32] selection:text-black relative flex flex-col justify-between w-full max-w-full overflow-x-clip">
      <ScrollToTop />
      <LoadingScreen />
      <CustomCursor />
      <Navbar />
      <main className="flex-grow w-full max-w-full min-w-0">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <Routes>
            {/* Unified Admin Portal (no separate server needed) */}
            <Route
              path="/admin/*"
              element={
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
                      <div className="h-10 w-10 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin mb-4" />
                      <span className="font-heading text-xs uppercase tracking-widest text-gray-400">
                        Loading Admin Portal...
                      </span>
                    </div>
                  }
                >
                  <AdminPortalRoutes />
                </Suspense>
              }
            />

            {/* Public Esports Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:slug" element={<TournamentDetailPage />} />
              <Route path="/my-tournaments" element={<MyTournamentsPage />} />
              <Route path="/players" element={<Navigate to="/about#players" replace />} />
              <Route path="/voting" element={<VotingPage />} />
              <Route path="/teams" element={<Navigate to="/about#teams" replace />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/jersey" element={<Navigate to="/products" replace />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/hall-of-glory" element={<Navigate to="/tournaments" replace />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/partners" element={<BrandPartnersPage />} />
              <Route path="/partner-with-us" element={<PartnersPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
