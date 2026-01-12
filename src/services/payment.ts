import { supabase } from "@/lib/supabase";
import { paymentOptionsService, userMembershipService, membershipService } from "@/services/database";

// Default PayU Configuration - Fallback if no payment option is configured
const DEFAULT_PAYU_KEY = import.meta.env.VITE_PAYU_KEY || "YOUR_PAYU_KEY";
const DEFAULT_PAYU_SALT = import.meta.env.VITE_PAYU_SALT || "YOUR_PAYU_SALT";
const DEFAULT_PAYU_BASE_URL =
  import.meta.env.VITE_PAYU_BASE_URL || "https://secure.payu.in";

export interface PaymentRequest {
  orderId: number;
  amount: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  description: string;
  paymentMethod: string;
}

export interface PaymentResponse {
  status: string;
  message: string;
  data?: any;
}

// Helper function to extract and process memberships from order
const processMembershipsForOrder = async (orderId: number, userId: string | null) => {
  console.log(`[PAYMENT] Starting processMembershipsForOrder - orderId: ${orderId}, userId: ${userId}`);

  if (!userId) {
    console.warn(`[PAYMENT] ❌ No userId provided, skipping membership processing`);
    return;
  }

  try {
    // Fetch the order to get membership details
    console.log(`[PAYMENT] Fetching order ${orderId}...`);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error(`[PAYMENT] ❌ Error fetching order: ${orderError.message}`);
      return;
    }

    if (!order) {
      console.warn(`[PAYMENT] ❌ Order not found: ${orderId}`);
      return;
    }

    if (!order.notes) {
      console.warn(`[PAYMENT] ⚠️ Order has no notes, skipping membership processing`);
      return;
    }

    console.log(`[PAYMENT] Order notes: ${order.notes}`);

    // Parse membership IDs from order notes
    // Format: "MEMBERSHIPS:[1,2,3]|other notes"
    const membershipMatch = order.notes.match(/MEMBERSHIPS:(\[[\d,\s]*\])/);
    if (!membershipMatch) {
      console.warn(`[PAYMENT] ⚠️ No membership IDs found in order notes`);
      return;
    }

    const membershipIds = JSON.parse(membershipMatch[1]) as number[];
    console.log(`[PAYMENT] ✅ Extracted membership IDs: ${JSON.stringify(membershipIds)}`);

    if (membershipIds.length === 0) {
      console.warn(`[PAYMENT] ⚠️ Empty membership IDs array`);
      return;
    }

    // Create user_membership records for each membership
    const now = new Date();
    console.log(`[PAYMENT] Processing ${membershipIds.length} memberships for user ${userId}`);

    for (const membershipId of membershipIds) {
      try {
        // Get membership details to know duration
        console.log(`[PAYMENT] Fetching membership ${membershipId}...`);
        const membership = await membershipService.getById(membershipId);

        if (!membership) {
          console.error(`[PAYMENT] ❌ Membership ${membershipId} not found`);
          continue;
        }

        console.log(`[PAYMENT] ✅ Membership found: ${membership.name}, duration: ${membership.duration_days} days`);

        // Check if user already has an active membership of the same type
        const { data: existingMemberships, error: fetchError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", userId)
          .eq("membership_id", membershipId)
          .order("end_date", { ascending: false });

        if (fetchError) {
          console.warn(`[PAYMENT] ⚠️ Could not fetch existing memberships: ${fetchError.message}`);
        }

        let startDate = new Date(now);
        let isActive = true;

        if (existingMemberships && existingMemberships.length > 0) {
          // Get the most recent membership
          const lastMembership = existingMemberships[0];
          const lastEndDate = new Date(lastMembership.end_date);

          // If there's an active membership, queue this one to start after it ends
          if (lastEndDate > now) {
            startDate = new Date(lastEndDate);
            isActive = false; // Mark as inactive - it will activate automatically when the previous one ends
            console.log(`[PAYMENT] ⚠️ Membership ${membershipId} will be queued. Previous membership ends: ${lastEndDate.toISOString()}`);
          } else {
            // Previous membership has expired, this one can start now
            console.log(`[PAYMENT] ℹ️ Previous membership has expired, activating new one immediately`);
          }
        }

        // Calculate end date based on the start date
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membership.duration_days);

        console.log(`[PAYMENT] Creating user_membership:
          - user_id: ${userId}
          - membership_id: ${membershipId}
          - start_date: ${startDate.toISOString()}
          - end_date: ${endDate.toISOString()}
          - is_active: ${isActive}`);

        // Create user membership
        const userMem = await userMembershipService.create({
          user_id: userId,
          membership_id: membershipId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: isActive,
        });

        console.log(
          `[PAYMENT] ✅✅ Successfully created user_membership:`,
          userMem
        );
      } catch (error) {
        console.error(
          `[PAYMENT] ❌ Failed to create membership ${membershipId} for user ${userId}:`,
          error
        );
      }
    }

    console.log(`[PAYMENT] ✅ Completed processing memberships for order ${orderId}`);
  } catch (error) {
    console.error(`[PAYMENT] ❌ Fatal error in processMembershipsForOrder:`, error);
  }
};

// Generate SHA512 hash for PayU
const generateHash = async (
  txnid: string,
  amount: number,
  productinfo: string,
  firstname: string,
  email: string,
  merchantKey: string,
  merchantSalt: string
): Promise<string> => {
  const str = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${merchantSalt}`;

  // Using Web Crypto API for SHA512
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
};

export const paymentService = {
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Fetch payment option from database
      let paymentOption;
      try {
        paymentOption = await paymentOptionsService.getByProvider(
          request.paymentMethod as any
        );
      } catch (error) {
        console.warn(
          "Payment option not found in database, using defaults:",
          error
        );
        // If payment option is not found, use defaults (for backward compatibility)
        paymentOption = null;
      }

      // Determine merchant credentials based on payment method
      let merchantKey: string;
      let merchantSalt: string;
      let baseUrl: string;

      if (request.paymentMethod === "payu" && paymentOption) {
        merchantKey = paymentOption.merchant_key;
        merchantSalt = paymentOption.merchant_salt || DEFAULT_PAYU_SALT;
        baseUrl = DEFAULT_PAYU_BASE_URL;
      } else if (request.paymentMethod === "paypal" && paymentOption) {
        // PayPal integration placeholder
        merchantKey = paymentOption.api_key || "";
        merchantSalt = paymentOption.api_secret || "";
        baseUrl = "https://www.paypal.com/cgi-bin/webscr";
      } else if (request.paymentMethod === "paytm" && paymentOption) {
        // Paytm integration placeholder
        merchantKey = paymentOption.merchant_key;
        merchantSalt = paymentOption.merchant_salt || "";
        baseUrl = "https://securegw.paytm.in/theia/api/v1/initiateTransaction";
      } else {
        // Fallback to default PayU if no payment option is configured
        merchantKey = DEFAULT_PAYU_KEY;
        merchantSalt = DEFAULT_PAYU_SALT;
        baseUrl = DEFAULT_PAYU_BASE_URL;
      }

      // Generate transaction ID
      const txnid = `TXN_${request.orderId}_${Date.now()}`;

      // Generate hash
      const hash = await generateHash(
        txnid,
        request.amount,
        `Order #${request.orderId}`,
        request.fullName,
        request.email,
        merchantKey,
        merchantSalt
      );

      // Prepare form data for PayU
      const payuFormData = {
        key: merchantKey,
        txnid: txnid,
        amount: request.amount.toString(),
        productinfo: `Order #${request.orderId}`,
        firstname: request.fullName,
        email: request.email,
        phone: request.phone,
        address1: request.address,
        city: request.city,
        state: request.state,
        zipcode: request.zipcode,
        hash: hash,
        surl: `${window.location.origin}/payment/success`,
        furl: `${window.location.origin}/payment/failed`,
        service_provider: "payu_paisa",
      };

      // Save transaction info for verification
      await supabase.from("payment_transactions").insert({
        transaction_id: txnid,
        order_id: request.orderId,
        amount: request.amount,
        email: request.email,
        phone: request.phone,
        hash: hash,
        status: "initiated",
      });

      // In production, you would redirect to PayU payment page
      // For now, we'll simulate the payment flow
      return {
        status: "success",
        message: "Payment initiated",
        data: {
          txnid: txnid,
          payuFormData: payuFormData,
          payuUrl: `${baseUrl}/_payment`,
          provider: request.paymentMethod,
        },
      };
    } catch (error) {
      console.error("Payment initiation error:", error);
      return {
        status: "error",
        message: "Failed to initiate payment",
      };
    }
  },

  async verifyPayment(
    txnid: string,
    payuResponse: any,
    merchantKey?: string,
    merchantSalt?: string
  ): Promise<PaymentResponse> {
    try {
      // Use provided credentials or fetch from database
      let key = merchantKey || DEFAULT_PAYU_KEY;
      let salt = merchantSalt || DEFAULT_PAYU_SALT;

      // If credentials are not provided, fetch from transaction
      if (!merchantKey || !merchantSalt) {
        try {
          const { data: transaction } = await supabase
            .from("payment_transactions")
            .select("*")
            .eq("transaction_id", txnid)
            .single();

          if (transaction && transaction.payu_response?.provider) {
            const paymentOption = await paymentOptionsService.getByProvider(
              transaction.payu_response.provider
            );
            key = paymentOption.merchant_key;
            salt = paymentOption.merchant_salt || DEFAULT_PAYU_SALT;
          }
        } catch (error) {
          console.warn("Could not fetch payment option for verification");
        }
      }

      // Verify hash from PayU response
      const verifyHash = await generateHash(
        txnid,
        payuResponse.amount,
        payuResponse.productinfo,
        payuResponse.firstname,
        payuResponse.email,
        key,
        salt
      );

      if (verifyHash !== payuResponse.hash) {
        return {
          status: "error",
          message: "Hash verification failed",
        };
      }

      // Update transaction status
      await supabase
        .from("payment_transactions")
        .update({
          status: payuResponse.status,
          payu_response: payuResponse,
        })
        .eq("transaction_id", txnid);

      // If payment is successful, update order and process memberships
      if (payuResponse.status === "success") {
        const { data: transaction } = await supabase
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", txnid)
          .single();

        if (transaction) {
          // Get order details to get user_id
          const { data: order } = await supabase
            .from("orders")
            .select("user_id")
            .eq("id", transaction.order_id)
            .single();

          await supabase
            .from("orders")
            .update({
              payment_status: "completed",
              payu_transaction_id: txnid,
              status: "confirmed",
            })
            .eq("id", transaction.order_id);

          // Process memberships if user is authenticated
          if (order?.user_id) {
            await processMembershipsForOrder(transaction.order_id, order.user_id);
          }
        }
      }

      return {
        status: payuResponse.status,
        message: "Payment verified",
        data: {
          txnid: txnid,
          status: payuResponse.status,
        },
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return {
        status: "error",
        message: "Failed to verify payment",
      };
    }
  },

  // For testing purposes - simulate payment success
  async simulatePaymentSuccess(orderId: number, amount: number, email: string, userId?: string) {
    try {
      const txnid = `SIM_${orderId}_${Date.now()}`;

      // Create payment transaction
      await supabase.from("payment_transactions").insert({
        transaction_id: txnid,
        order_id: orderId,
        amount: amount,
        email: email,
        status: "success",
        simulated: true,
      });

      // Update order status
      await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          payu_transaction_id: txnid,
          status: "confirmed",
        })
        .eq("id", orderId);

      // Process memberships if user is provided
      if (userId) {
        await processMembershipsForOrder(orderId, userId);
      }

      return {
        status: "success",
        message: "Payment simulated successfully",
        data: { txnid },
      };
    } catch (error) {
      console.error("Simulation error:", error);
      return {
        status: "error",
        message: "Failed to simulate payment",
      };
    }
  },

  // Helper function to activate queued memberships when current one expires
  async activateQueuedMemberships(userId: string) {
    try {
      console.log(`[PAYMENT] Starting activateQueuedMemberships for user ${userId}`);

      // Get all memberships for user
      const { data: allMemberships, error } = await supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: true });

      if (error) {
        console.error(`[PAYMENT] Error fetching memberships:`, error);
        return;
      }

      const now = new Date();

      // Group by membership_id
      const groupedByMembershipId: Record<number, any[]> = {};
      allMemberships?.forEach((mem: any) => {
        if (!groupedByMembershipId[mem.membership_id]) {
          groupedByMembershipId[mem.membership_id] = [];
        }
        groupedByMembershipId[mem.membership_id].push(mem);
      });

      // Check each group and activate queued memberships
      for (const membershipId in groupedByMembershipId) {
        const memberships = groupedByMembershipId[membershipId];

        // Find the active one
        const activeOne = memberships.find((m: any) => {
          const startDate = new Date(m.start_date);
          const endDate = new Date(m.end_date);
          return startDate <= now && endDate > now;
        });

        if (!activeOne) {
          // No active membership, find the first queued one and activate it
          const firstQueued = memberships
            .filter((m: any) => new Date(m.start_date) <= now)
            .sort((a: any, b: any) =>
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            )[0];

          if (firstQueued) {
            console.log(`[PAYMENT] Activating queued membership ${firstQueued.id}`);
            await supabase
              .from("user_memberships")
              .update({ is_active: true })
              .eq("id", firstQueued.id);
          }
        }
      }

      console.log(`[PAYMENT] ✅ Completed activateQueuedMemberships for user ${userId}`);
    } catch (error) {
      console.error(`[PAYMENT] Error in activateQueuedMemberships:`, error);
    }
  },
};
