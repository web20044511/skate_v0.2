import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { orderService, userMembershipService } from "@/services/database";
import { Eye, Package, Check, Truck, Home, Clock, Crown, Zap, Gift, Trophy, Star, Flame } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Show success message if coming from checkout
    if (location.state?.orderId) {
      toast.success("Order placed successfully! You can track it below.");
    }
  }, [location.state]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        const data = await orderService.getByUserId(user.id);
        setOrders(data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">
              Track and manage all your orders in one place
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
                <p className="text-gray-600">Loading your orders...</p>
              </CardContent>
            </Card>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
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
                          {order.order_items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {item.products?.name || "Product"} x{" "}
                                {item.quantity}
                              </span>
                              <span className="font-medium">
                                ₹{item.price.toFixed(2)}
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
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start shopping to place your first order
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
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.products?.name || "Product"} x {item.quantity}
                      </span>
                      <span>₹{item.price.toFixed(2)}</span>
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
                  <h3 className="font-semibold mb-2 text-sm text-blue-900">Order Status Update</h3>
                  <p className="text-sm text-blue-800">{selectedOrder.status_comment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
