import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { orderService, orderItemService, paymentOptionsService } from "@/services/database";
import { paymentService } from "@/services/payment";
import { PaymentOption } from "@/types/database";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentOption[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    notes: "",
    paymentMethod: "payu",
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true);
      const methods = await paymentOptionsService.getEnabled();
      setPaymentMethods(methods);
      // Set the first enabled payment method as default if available
      if (methods.length > 0) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: methods[0].provider,
        }));
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  // Show loading while authentication is being checked
  if (isAuthLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-6">
                  Add some items before proceeding to checkout
                </p>
                <Button onClick={() => navigate("/store")}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Validate form
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.phone ||
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.zipcode
      ) {
        toast.error("Please fill in all required fields");
        setIsProcessing(false);
        return;
      }

      // Validate that a payment method is selected
      if (!formData.paymentMethod || paymentMethods.length === 0) {
        toast.error("No payment methods available. Please contact support.");
        setIsProcessing(false);
        return;
      }

      // Create order
      const orderNumber = `ORD-${Date.now()}`;
      const order = await orderService.create({
        user_id: user!.id,
        order_number: orderNumber,
        status: "pending",
        total_amount: total,
        payment_method: formData.paymentMethod,
        payment_status: "pending",
        shipping_address: {
          name: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zipcode,
          phone: formData.phone,
        },
        notes: formData.notes,
      });

      // Add order items - handle both old and new cart item structures
      for (const item of items) {
        const productId = item.product?.id || item.id;
        const productPrice = item.product?.price || item.price;

        await orderItemService.addItem(
          order.id,
          productId as number,
          item.quantity,
          productPrice
        );
      }

      // Initiate payment with demo mode
      const paymentResult = await paymentService.simulatePaymentSuccess(
        order.id,
        total,
        user!.email
      );

      if (paymentResult.status === "success") {
        clearCart();
        toast.success("Order placed successfully!");
        navigate("/orders", {
          state: { orderId: order.id, orderNumber: orderNumber },
        });
      } else {
        toast.error("Payment processing failed. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/store")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shopping
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitOrder} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium">
                          Full Name *
                        </label>
                        <Input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Phone *
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium">
                          Address *
                        </label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          City *
                        </label>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          State *
                        </label>
                        <Input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Zipcode *
                        </label>
                        <Input
                          name="zipcode"
                          value={formData.zipcode}
                          onChange={handleChange}
                          required
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium">
                          Special Instructions
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Payment Method *
                      </label>
                      {isLoadingPaymentMethods ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="text-center">
                            <div className="inline-block mb-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                            <p className="text-sm text-gray-600">Loading payment methods...</p>
                          </div>
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50">
                          <p className="text-sm text-red-700">
                            No payment methods available. Please contact support.
                          </p>
                        </div>
                      ) : (
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentMethod: e.target.value,
                            })
                          }
                          disabled={isProcessing || paymentMethods.length === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          required
                        >
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.provider}>
                              {method.provider.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isProcessing || paymentMethods.length === 0}
                    >
                      {isProcessing ? "Processing..." : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.map((item) => {
                      const productName = item.product?.name || "Product";
                      const productPrice = item.product?.price || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm pb-3 border-b"
                        >
                          <div>
                            <p className="font-medium">{productName}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">
                            ₹{(productPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                    <p className="font-semibold mb-1">Demo Mode</p>
                    <p>
                      This is a demo checkout. Payment will be simulated as successful.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
