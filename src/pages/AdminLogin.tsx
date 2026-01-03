import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { testSupabaseConnection } from "@/lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? "✓ Connected" : "✗ Connection Failed");
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AdminLogin] Form submitted");
    setIsSubmitting(true);

    try {
      console.log("[AdminLogin] Calling login function");
      await login(email, password);
      console.log("[AdminLogin] Login successful, redirecting");

      // Check if user is admin after login
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("[AdminLogin] Login error:", error);
      const errorMsg = error?.message || "Failed to sign in. Please try again.";
      console.error("[AdminLogin] Error message:", errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-gray-600">
            Enter your credentials to access the admin dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium mb-2">Demo Admin Account:</p>
            <p>Email: admin@example.com</p>
            <p>Password: admin123</p>
            {connectionStatus && (
              <p className="mt-3 pt-3 border-t border-blue-200 text-xs">
                Supabase: {connectionStatus}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
