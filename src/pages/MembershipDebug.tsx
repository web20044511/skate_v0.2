import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { userMembershipService, membershipService } from "@/services/database";
import { paymentService } from "@/services/payment";
import { toast } from "sonner";

export default function MembershipDebug() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testTableExistence = async () => {
    try {
      setIsLoading(true);
      addLog("🔍 Testing table existence...");

      // Test memberships table
      addLog("Testing memberships table...");
      const { data: memberships, error: memberError } = await supabase
        .from("memberships")
        .select("count");
      if (memberError) {
        addLog(`❌ Memberships table error: ${memberError.message}`);
      } else {
        addLog(`✅ Memberships table exists: ${JSON.stringify(memberships)}`);
      }

      // Test user_memberships table
      addLog("Testing user_memberships table...");
      const { data: userMems, error: userMemError } = await supabase
        .from("user_memberships")
        .select("count");
      if (userMemError) {
        addLog(`❌ User_memberships table error: ${userMemError.message}`);
      } else {
        addLog(`✅ User_memberships table exists: ${JSON.stringify(userMems)}`);
      }

      // Test payment_transactions table
      addLog("Testing payment_transactions table...");
      const { data: transactions, error: transError } = await supabase
        .from("payment_transactions")
        .select("count");
      if (transError) {
        addLog(`❌ Payment_transactions table error: ${transError.message}`);
      } else {
        addLog(`✅ Payment_transactions table exists: ${JSON.stringify(transactions)}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserMemberships = async () => {
    if (!user?.id) {
      toast.error("Please log in first");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`🔍 Checking memberships for user: ${user.id}`);

      const data = await userMembershipService.getByUserId(user.id);
      addLog(`✅ Found ${data.length} membership(s)`);
      addLog(`Data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSimulatePayment = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Please log in first");
      return;
    }

    try {
      setIsLoading(true);
      addLog("🔍 Creating test order with membership...");

      // Get first membership
      const memberships = await membershipService.getAll();
      if (memberships.length === 0) {
        addLog("❌ No memberships found in database");
        return;
      }

      const membership = memberships[0];
      addLog(`Found membership: ${membership.name} (ID: ${membership.id})`);

      // Create a test order with membership
      const { supabase: supabaseClient } = await import("@/lib/supabase");
      const orderNumber = `TEST-${Date.now()}`;
      const membershipIds = [membership.id];

      addLog(`Creating order with membership IDs: ${JSON.stringify(membershipIds)}`);

      const { data: order, error: orderError } = await supabaseClient
        .from("orders")
        .insert([
          {
            user_id: user.id,
            order_number: orderNumber,
            status: "pending",
            total_amount: membership.price,
            payment_method: "payu",
            payment_status: "pending",
            shipping_address: {
              name: user.full_name || "Test User",
              address: "Test Address",
              city: "Test City",
              state: "Test State",
              zip: "000000",
              phone: "0000000000",
            },
            notes: `MEMBERSHIPS:${JSON.stringify(membershipIds)}|Test Order`,
            customer_email: user.email,
            customer_phone: "0000000000",
          },
        ])
        .select()
        .single();

      if (orderError) {
        addLog(`❌ Error creating order: ${orderError.message}`);
        return;
      }

      addLog(`✅ Order created: ${order.id}`);

      // Simulate payment
      addLog(`Simulating payment for order ${order.id}...`);
      const paymentResult = await paymentService.simulatePaymentSuccess(
        order.id,
        membership.price,
        user.email,
        user.id
      );

      addLog(`Payment result: ${JSON.stringify(paymentResult)}`);

      // Check if membership was created
      addLog("Checking if user_membership was created...");
      setTimeout(async () => {
        const memberships = await userMembershipService.getByUserId(user.id);
        addLog(`✅ User now has ${memberships.length} membership(s)`);
        addLog(`Data: ${JSON.stringify(memberships, null, 2)}`);
      }, 1000);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🔧 Membership Debug</h1>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>User Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>ID:</strong> {user?.id || "Not logged in"}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {user?.email || "Not logged in"}
                </p>
                <p className="text-sm">
                  <strong>Name:</strong> {user?.full_name || "Not set"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debug Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={testTableExistence}
                  disabled={isLoading}
                  className="w-full"
                >
                  1️⃣ Test Tables Exist
                </Button>
                <Button
                  onClick={testUserMemberships}
                  disabled={isLoading}
                  className="w-full"
                >
                  2️⃣ Check Your Memberships
                </Button>
                <Button
                  onClick={testSimulatePayment}
                  disabled={isLoading}
                  className="w-full"
                >
                  3️⃣ Simulate Purchase
                </Button>
                <Button
                  onClick={clearLogs}
                  variant="outline"
                  className="w-full"
                >
                  Clear Logs
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p>Click buttons above to start debugging...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
