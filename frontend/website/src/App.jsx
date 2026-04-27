import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

// Public website pages
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GalleryPage from "./pages/GalleryPage";
import ProfilePage from "./pages/ProfilePage";

// Admin dashboard pages
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminAppointments from "./admin/AdminAppointments";
import AdminStaff from "./admin/AdminStaff";
import AdminServices from "./admin/AdminServices";
import AdminPhotos from "./admin/AdminPhotos";
import AdminCoupons from "./admin/AdminCoupons";
import AdminUsers from "./admin/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public website ─────────── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* ── Admin dashboard ─────────── */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="photos" element={<AdminPhotos />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}