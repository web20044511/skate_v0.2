import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userMembershipService } from "@/services/database";
import {
  Users,
  Search,
  Filter,
  Calendar,
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: number;
  user_id: string;
  membership_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  memberships: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    duration_days: number;
    benefits: Record<string, any> | null;
    icon: string | null;
    color: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "queued"
  >("all");

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchQuery, statusFilter]);

  const loadSubscribers = async () => {
    try {
      setIsLoading(true);
      const data = await userMembershipService.getAllSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error("Error loading subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = [...subscribers];

    // Apply status filter
    const now = new Date();
    if (statusFilter === "active") {
      filtered = filtered.filter(
        (sub) => sub.is_active && new Date(sub.end_date) > now
      );
    } else if (statusFilter === "expired") {
      filtered = filtered.filter(
        (sub) => !sub.is_active || new Date(sub.end_date) <= now
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.profiles?.full_name?.toLowerCase().includes(query) ||
          sub.profiles?.email?.toLowerCase().includes(query) ||
          sub.memberships?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredSubscribers(filtered);
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const isSubscriptionActive = (subscriber: Subscriber) => {
    return subscriber.is_active && calculateDaysRemaining(subscriber.end_date) > 0;
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
          </div>
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  const activeCount = subscribers.filter((sub) => isSubscriptionActive(sub))
    .length;
  const expiredCount = subscribers.length - activeCount;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="text-gray-600">Loading subscribers...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all active and expired membership subscriptions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Subscribers"
            value={subscribers.length}
            icon={Users}
          />
          <StatCard
            title="Active Subscriptions"
            value={activeCount}
            icon={CheckCircle}
            trend={`${((activeCount / subscribers.length) * 100 || 0).toFixed(0)}% active`}
          />
          <StatCard
            title="Expired Subscriptions"
            value={expiredCount}
            icon={AlertCircle}
          />
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or membership..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "expired")
                }
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSubscribers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {subscribers.length === 0
                    ? "No subscribers yet"
                    : "No subscribers match your filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Membership
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Start Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        End Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Days Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber) => {
                      const daysRemaining = calculateDaysRemaining(
                        subscriber.end_date
                      );
                      const isActive = isSubscriptionActive(subscriber);

                      return (
                        <tr
                          key={subscriber.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          {/* User Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {subscriber.profiles?.full_name
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {subscriber.profiles?.full_name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {subscriber.profiles?.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Membership Info */}
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {subscriber.memberships?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ₹{subscriber.memberships?.price || 0}
                              </p>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Expired
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="py-4 px-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(subscriber.start_date).toLocaleDateString(
                                "en-IN"
                              )}
                            </div>
                          </td>

                          {/* End Date */}
                          <td className="py-4 px-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(subscriber.end_date).toLocaleDateString(
                                "en-IN"
                              )}
                            </div>
                          </td>

                          {/* Days Remaining */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span
                                className={`font-medium ${
                                  daysRemaining > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {daysRemaining > 0
                                  ? `${daysRemaining} days`
                                  : "Expired"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Section */}
        {subscribers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Membership Distribution */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">
                        Top Membership
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg mt-1">
                        {(() => {
                          const membershipCounts: Record<string, number> = {};
                          subscribers.forEach((sub) => {
                            const name = sub.memberships?.name || "Unknown";
                            membershipCounts[name] =
                              (membershipCounts[name] || 0) + 1;
                          });
                          const topMembership = Object.entries(membershipCounts).sort(
                            ([, a], [, b]) => b - a
                          )[0];
                          return topMembership ? topMembership[0] : "N/A";
                        })()}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const membershipCounts: Record<string, number> = {};
                      subscribers.forEach((sub) => {
                        const name = sub.memberships?.name || "Unknown";
                        membershipCounts[name] =
                          (membershipCounts[name] || 0) + 1;
                      });
                      const topMembership = Object.entries(membershipCounts).sort(
                        ([, a], [, b]) => b - a
                      )[0];
                      return topMembership
                        ? `${topMembership[1]} subscriber${
                            topMembership[1] !== 1 ? "s" : ""
                          }`
                        : "No data";
                    })()}
                  </p>
                </div>

                {/* Average Subscription Duration */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">
                        Avg Duration
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg mt-1">
                        {(() => {
                          if (subscribers.length === 0) return "N/A";
                          const totalDays = subscribers.reduce((sum, sub) => {
                            const start = new Date(sub.start_date);
                            const end = new Date(sub.end_date);
                            const diff = end.getTime() - start.getTime();
                            return sum + Math.ceil(diff / (1000 * 60 * 60 * 24));
                          }, 0);
                          return `${Math.round(totalDays / subscribers.length)} days`;
                        })()}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Per subscription period
                  </p>
                </div>

                {/* Upcoming Renewals (Next 30 Days) */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">
                        Expiring Soon
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg mt-1">
                        {(() => {
                          const now = new Date();
                          const thirtyDaysLater = new Date(
                            now.getTime() + 30 * 24 * 60 * 60 * 1000
                          );
                          return subscribers.filter((sub) => {
                            const endDate = new Date(sub.end_date);
                            return (
                              endDate > now &&
                              endDate <= thirtyDaysLater &&
                              sub.is_active
                            );
                          }).length;
                        })()}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    In the next 30 days
                  </p>
                </div>

                {/* Revenue Potential */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">
                        Total MRR
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg mt-1">
                        ₹
                        {(() => {
                          const totalRevenue = subscribers
                            .filter((sub) => isSubscriptionActive(sub))
                            .reduce((sum, sub) => {
                              return (
                                sum + (sub.memberships?.price || 0)
                              );
                            }, 0);
                          return totalRevenue.toLocaleString("en-IN");
                        })()}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Monthly Recurring Revenue
                  </p>
                </div>
              </div>

              {/* Membership Breakdown */}
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Membership Distribution
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const membershipStats: Record<
                      string,
                      { count: number; active: number; price: number }
                    > = {};
                    subscribers.forEach((sub) => {
                      const name = sub.memberships?.name || "Unknown";
                      if (!membershipStats[name]) {
                        membershipStats[name] = {
                          count: 0,
                          active: 0,
                          price: sub.memberships?.price || 0,
                        };
                      }
                      membershipStats[name].count++;
                      if (isSubscriptionActive(sub)) {
                        membershipStats[name].active++;
                      }
                    });

                    return Object.entries(membershipStats).map(
                      ([name, stats]) => {
                        const percentage = Math.round(
                          (stats.count / subscribers.length) * 100
                        );
                        return (
                          <div key={name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {name}
                              </span>
                              <span className="text-xs text-gray-600">
                                {stats.active}/{stats.count} active (₹{stats.price})
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
