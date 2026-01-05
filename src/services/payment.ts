import { supabase } from "@/lib/supabase";
import { paymentOptionsService } from "@/services/database";

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

// Generate SHA512 hash for PayU
const generateHash = async (
  txnid: string,
  amount: number,
  productinfo: string,
  firstname: string,
  email: string
): Promise<string> => {
  const str = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;

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
      // Generate transaction ID
      const txnid = `TXN_${request.orderId}_${Date.now()}`;

      // Generate hash
      const hash = await generateHash(
        txnid,
        request.amount,
        `Order #${request.orderId}`,
        request.fullName,
        request.email
      );

      // Prepare form data for PayU
      const payuFormData = {
        key: PAYU_KEY,
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
          payuUrl: `${PAYU_BASE_URL}/_payment`,
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

  async verifyPayment(txnid: string, payuResponse: any): Promise<PaymentResponse> {
    try {
      // Verify hash from PayU response
      const verifyHash = await generateHash(
        txnid,
        payuResponse.amount,
        payuResponse.productinfo,
        payuResponse.firstname,
        payuResponse.email
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

      // If payment is successful, update order
      if (payuResponse.status === "success") {
        const { data: transaction } = await supabase
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", txnid)
          .single();

        if (transaction) {
          await supabase
            .from("orders")
            .update({
              payment_status: "completed",
              payu_transaction_id: txnid,
              status: "confirmed",
            })
            .eq("id", transaction.order_id);
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
  async simulatePaymentSuccess(orderId: number, amount: number, email: string) {
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
};
