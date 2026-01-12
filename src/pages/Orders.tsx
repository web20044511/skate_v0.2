import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { orderService, userMembershipService } from "@/services/database";
import { paymentService } from "@/services/payment";
import { Eye, Package, Check, Truck, Home, Clock, Crown, Zap, Gift, Trophy, Star, Flame } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrdersAndMemberships();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Show success message if coming from checkout
    if (location.state?.orderId) {
      toast.success("Order placed successfully! You can track it below.");
    }
  }, [location.state]);

  const loadOrdersAndMemberships = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        // First, activate any queued memberships that are ready
        await paymentService.activateQueuedMemberships(user.id);

        const [ordersData, membershipsData] = await Promise.all([
          orderService.getByUserId(user.id),
          userMembershipService.getUserMembershipsWithQueue(user.id),
        ]);

        // Combine orders and memberships
        const combinedItems = [
          ...ordersData.map((order: any) => ({
            ...order,
            type: "order",
            date: new Date(order.created_at),
          })),
          ...membershipsData.map((membership: any) => ({
            ...membership,
            type: "membership",
            date: new Date(membership.created_at),
          })),
        ];

        // Sort by date (newest first)
        combinedItems.sort((a, b) => b.date.getTime() - a.date.getTime());

        setItems(combinedItems);
      }
    } catch (error) {
      console.error("Error loading orders and memberships:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const getColorFromMembership = (color: string | null) => {
    const colorMap: Record<string, string> = {
      gold: "from-yellow-400 to-yellow-600",
      silver: "from-gray-300 to-gray-500",
      platinum: "from-cyan-400 to-blue-600",
      bronze: "from-orange-400 to-orange-600",
      blue: "from-blue-400 to-blue-600",
      purple: "from-purple-400 to-purple-600",
      pink: "from-pink-400 to-pink-600",
      green: "from-green-400 to-green-600",
    };
    return colorMap[color || "blue"] || colorMap.blue;
  };

  const getMembershipIcon = (iconName: string | null) => {
    const iconClass = "w-6 h-6";
    switch (iconName) {
      case "Crown":
        return <Crown className={iconClass} />;
      case "Zap":
        return <Zap className={iconClass} />;
      case "Gift":
        return <Gift className={iconClass} />;
      case "Trophy":
        return <Trophy className={iconClass} />;
      case "Star":
        return <Star className={iconClass} />;
      case "Flame":
        return <Flame className={iconClass} />;
      default:
        return <Crown className={iconClass} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-5 h-5";
    switch (status) {
      case "pending":
        return <Clock className={iconClass} />;
      case "confirmed":
        return <Check className={iconClass} />;
      case "processing":
        return <Package className={iconClass} />;
      case "shipped":
        return <Truck className={iconClass} />;
      case "delivered":
        return <Home className={iconClass} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50",
      confirmed: "text-blue-600 bg-blue-50",
      processing: "text-blue-600 bg-blue-50",
      shipped: "text-purple-600 bg-purple-50",
      delivered: "text-green-600 bg-green-50",
      cancelled: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const orderSteps = [
    { status: "confirmed", label: "Confirmed", icon: Check },
    { status: "processing", label: "Processing", icon: Package },
    { status: "shipped", label: "Shipped", icon: Truck },
    { status: "delivered", label: "Delivered", icon: Home },
  ];

  const getOrderProgress = (order: any) => {
    const steps = ["confirmed", "processing", "shipped", "delivered"];
    return steps.indexOf(order.status) + 1;
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign in to view orders
                </h2>
                <p className="text-gray-600 mb-6">
                  Please log in to see your order history and tracking information
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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders & Memberships</h1>
            <p className="text-gray-600 mt-1">
              Track your orders and manage your membership subscriptions
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
                <p className="text-gray-600">Loading your orders...</p>
              </CardContent>
            </Card>
          ) : items.length > 0 ? (
            <div className="space-y-6">
              {items.map((item) => {
                if (item.type === "membership") {
                  // Membership Card
                  const colorClass = getColorFromMembership(item.membership?.color);
                  const membershipStatus = item.status || (item.is_active ? "active" : "expired");

                  const getStatusDisplay = () => {
                    switch (membershipStatus) {
                      case "active":
                        return { text: "✓ Active", bgColor: "bg-green-400/30" };
                      case "queued":
                        return {
                          text: `Queued #${item.queuePosition}`,
                          bgColor: "bg-blue-400/30"
                        };
                      case "pending":
                        return {
                          text: "Upcoming",
                          bgColor: "bg-amber-400/30"
                        };
                      case "expired":
                        return {
                          text: "Expired",
                          bgColor: "bg-red-400/30"
                        };
                      default:
                        return {
                          text: "Active",
                          bgColor: "bg-green-400/30"
                        };
                    }
                  };

                  const statusDisplay = getStatusDisplay();

                  return (
                    <div
                      key={`membership-${item.id}`}
                      className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                        membershipStatus === "queued" ? "opacity-85" : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-95`}
                      />

                      {/* Queued overlay indicator */}
                      {membershipStatus === "queued" && (
                        <div className="absolute top-0 left-0 right-0 bg-blue-600/50 text-white text-xs font-semibold py-2 px-4 text-center backdrop-blur-sm">
                          Queued for Renewal - Activates {new Date(item.nextActivationDate).toLocaleDateString()}
                        </div>
                      )}

                      {/* Background decorations */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

                      <div className={`relative p-6 sm:p-8 ${membershipStatus === "queued" ? "pt-16" : ""}`}>
                        {/* Header with Icon */}
                        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm text-white">
                              {getMembershipIcon(item.membership?.icon)}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">
                                {item.membership?.name || "Membership"}
                              </h3>
                              <p className="text-white/80 text-sm mt-1">
                                Purchased on {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                              ₹{item.membership?.price || 0}
                            </div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusDisplay.bgColor} text-white backdrop-blur-sm border border-white/20`}
                            >
                              {statusDisplay.text}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className={`grid gap-4 mb-6 ${membershipStatus === "queued" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                            <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                              Start Date
                            </p>
                            <p className="text-white font-semibold text-lg mt-2">
                              {new Date(item.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                            <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                              End Date
                            </p>
                            <p className="text-white font-semibold text-lg mt-2">
                              {new Date(item.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          {membershipStatus !== "queued" && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                              <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                                Duration
                              </p>
                              <p className="text-white font-semibold text-lg mt-2">
                                {item.membership?.duration_days || 0} days
                              </p>
                            </div>
                          )}
                          {membershipStatus === "queued" && (
                            <div className="bg-blue-400/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                              <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                                Activates On
                              </p>
                              <p className="text-white font-semibold text-lg mt-2">
                                {new Date(item.nextActivationDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Benefits */}
                        {item.membership?.benefits &&
                          Object.keys(item.membership.benefits).length > 0 && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                              <p className="text-white/70 text-xs uppercase tracking-wider font-medium mb-3">
                                Benefits
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(item.membership.benefits)
                                  .slice(0, 4)
                                  .map(([key, value]: [string, any]) => (
                                    <div
                                      key={key}
                                      className="flex items-start gap-2"
                                    >
                                      <Check className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                                      <span className="text-white/90 text-sm">
                                        {value || key}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Queue Information */}
                        {membershipStatus === "queued" && (
                          <div className="bg-blue-400/20 backdrop-blur-sm rounded-lg p-4 border border-blue-300/30">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-white font-semibold mb-2">
                                  📋 Queue Position #{item.queuePosition}
                                </p>
                                <p className="text-white/80 text-sm">
                                  This membership will automatically activate on{" "}
                                  <span className="font-semibold">
                                    {new Date(item.nextActivationDate).toLocaleDateString()}
                                  </span>
                                  , replacing your current subscription.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Auto-Renewal Info */}
                        {membershipStatus === "active" && (
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                            <p className="text-white/70 text-xs uppercase tracking-wider font-medium mb-2">
                              ℹ️ Auto-Renewal
                            </p>
                            <p className="text-white/90 text-sm">
                              This membership will automatically activate any queued renewals on{" "}
                              <span className="font-semibold">
                                {new Date(item.end_date).toLocaleDateString()}
                              </span>
                              .
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // Product Order Card
                  const order = item;
                  return (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          {/* Order Header */}
                          <div className="flex items-center justify-between pb-6 border-b">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Order #{order.order_number}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Placed on{" "}
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{order.total_amount.toFixed(2)}
                              </p>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Order Progress */}
                          {order.status !== "cancelled" && (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">
                                Delivery Status
                              </p>
                              <div className="flex items-center justify-between">
                                {orderSteps.map((step, index) => {
                                  const StepIcon = step.icon;
                                  const isCompleted =
                                    getOrderProgress(order) > index;
                                  const isCurrent =
                                    getOrderProgress(order) === index + 1;

                                  return (
                                    <div
                                      key={step.status}
                                      className="flex flex-col items-center flex-1"
                                    >
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                          isCompleted || isCurrent
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                        }`}
                                      >
                                        <StepIcon className="w-5 h-5" />
                                      </div>
                                      <p className="text-xs font-medium text-gray-600 text-center">
                                        {step.label}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Order Items Summary */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900">
                              Items ({order.order_items?.length || 0})
                            </p>
                            <div className="space-y-2">
                              {order.order_items?.map((orderItem: any) => (
                                <div
                                  key={orderItem.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-600">
                                    {orderItem.products?.name || "Product"} x{" "}
                                    {orderItem.quantity}
                                  </span>
                                  <span className="font-medium">
                                    ₹{orderItem.price.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment Status */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-sm text-gray-600">
                                Payment Status
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.payment_status === "completed"
                                  ? "✓ Paid"
                                  : "Pending"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No orders or memberships yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start shopping or upgrade your membership
                </p>
                <Button onClick={() => navigate("/store")}>
                  Shop Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader className="flex items-center justify-between border-b">
              <CardTitle>Order Details #{selectedOrder.order_number}</CardTitle>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Order Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="font-medium text-lg">
                    ₹{selectedOrder.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((orderItem: any) => (
                    <div
                      key={orderItem.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {orderItem.products?.name || "Product"} x{" "}
                        {orderItem.quantity}
                      </span>
                      <span>₹{orderItem.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{selectedOrder.shipping_address.name}</p>
                    <p>{selectedOrder.shipping_address.address}</p>
                    <p>
                      {selectedOrder.shipping_address.city},{" "}
                      {selectedOrder.shipping_address.state}
                    </p>
                    <p>{selectedOrder.shipping_address.zip}</p>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.status_comment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="font-semibold mb-2 text-sm text-blue-900">
                    Order Status Update
                  </h3>
                  <p className="text-sm text-blue-800">
                    {selectedOrder.status_comment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
