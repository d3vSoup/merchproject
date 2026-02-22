// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./auth/AuthContext";
import { Analytics } from "./api/analytics";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import EventPage from "./pages/Events/EventPage";
import ClubPage from "./pages/Events/ClubPage";
import CartPage from "./pages/Cart/CartPage";
import ResellPage from "./pages/Resell/ResellPage";
import ResellChat from "./pages/Resell/ResellChat";
import WishlistPage from "./pages/Wishlist/WishlistPage";
import OrderHistory from "./pages/Orders/OrderHistory";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminItems from "./pages/Admin/AdminItems";
import AboutPage from "./pages/About/AboutPage";
import ContactPage from "./pages/Contact/ContactPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import { useCartCount } from "./hooks/useCartCount";

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();
  const { cartCount } = useCartCount();
  const location = useLocation();

  useEffect(() => {
    Analytics.pageView(location.pathname, document.title);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Layout cartCount={cartCount}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/event/club" element={<ClubPage />} />
          <Route path="/event/:eventKey" element={<EventPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/resell" element={<ResellPage />} />
          <Route path="/resell/chat/:chatId" element={<ResellChat />} />
          <Route
            path="/admin"
            element={
              user?.isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              user?.isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/orders"
            element={
              user?.isAdmin ? (
                <AdminOrders />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/items"
            element={
              user?.isAdmin ? (
                <AdminItems />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
