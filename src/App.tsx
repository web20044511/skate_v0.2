import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { migrationService } from "@/services/migrations";
import Index from "./pages/Index";
import Store from "./pages/Store";
import ProductPage from "./pages/ProductPage";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Programme from "./pages/Programme";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminInventory from "./pages/AdminInventory";
import AdminPaymentOptions from "./pages/AdminPaymentOptions";
import AdminMemberships from "./pages/AdminMemberships";
import AdminSubscribers from "./pages/AdminSubscribers";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

// Initialize the app with seed data
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    migrationService.seedInitialProducts();
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppInitializer>
              <CartDrawer />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/store" element={<Store />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/programme" element={<Programme />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<UserProfile />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedAdminRoute>
                    <AdminOrders />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/inventory"
                element={
                  <ProtectedAdminRoute>
                    <AdminInventory />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/payment-options"
                element={
                  <ProtectedAdminRoute>
                    <AdminPaymentOptions />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/memberships"
                element={
                  <ProtectedAdminRoute>
                    <AdminMemberships />
                  </ProtectedAdminRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </AppInitializer>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
