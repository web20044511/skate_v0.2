import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import MembershipCard from "@/components/MembershipCard";
import { userMembershipService, membershipService } from "@/services/database";
import { Membership, UserMembership } from "@/types/database";
import { LogOut, Edit2, Calendar, Award, Star, Crown, Flame, Zap, Gift, Trophy, Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Star,
  Crown,
  Flame,
  Zap,
  Gift,
  Trophy,
  Heart,
  Award,
};

const colorMap: Record<string, string> = {
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  blue: "#3B82F6",
  purple: "#A855F7",
  emerald: "#10B981",
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [memberships, setMemberships] = useState<(UserMembership & { membership: Membership | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadMemberships();
    }
  }, [isAuthenticated, user]);

  const loadMemberships = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        console.log(`[PROFILE] Loading memberships for user ${user.id}...`);
        const data = await userMembershipService.getByUserId(user.id);
        console.log(`[PROFILE] Loaded ${data.length} memberships:`, data);

        // Filter and map memberships to ensure proper structure
        const validMemberships = (data || []).filter(item => {
          const hasMembership = item.membership && typeof item.membership === 'object';
          if (!hasMembership) {
            console.warn(`[PROFILE] Skipping membership without valid membership object:`, item);
          }
          return hasMembership;
        });

        console.log(`[PROFILE] Valid memberships after filtering: ${validMemberships.length}`);
        setMemberships(validMemberships);

        if (validMemberships.length > 0) {
          toast.success(`Loaded ${validMemberships.length} membership(s)`);
        }
      }
    } catch (error) {
      console.error("Error loading memberships:", error);
      toast.error("Failed to load memberships");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log(`[PROFILE] User clicked refresh memberships`);
      await loadMemberships();
      toast.success("Memberships refreshed!");
    } catch (error) {
      console.error("Error refreshing memberships:", error);
      toast.error("Failed to refresh memberships");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign in to view your profile
                </h2>
                <p className="text-gray-600 mb-6">
                  Please log in to see your memberships and account details
                </p>
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your account and memberships</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="gap-2 text-xs sm:text-sm"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Logout
              </Button>
            </div>

            {/* User Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                      {user?.full_name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Email Address</p>
                    <p className="text-xs sm:text-lg font-bold text-gray-900 mt-1 break-all">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Memberships Section */}
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Memberships</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Active and inactive memberships</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="gap-2 text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                  <span className="sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
                </Button>
                <Button
                  onClick={() => navigate("/programme")}
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Browse Memberships</span>
                  <span className="sm:hidden">Browse</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
                <p className="text-gray-600">Loading memberships...</p>
              </div>
            ) : memberships.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No memberships yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Explore our membership tiers and get exclusive benefits
                  </p>
                  <Button
                    onClick={() => navigate("/programme")}
                    size="lg"
                  >
                    Explore Memberships
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {memberships.map((userMembership) => (
                  <MembershipCard
                    key={userMembership.id}
                    userMembership={userMembership}
                    onRenew={() => navigate("/programme")}
                    onManage={() => {
                      toast.info("Membership management coming soon!");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
