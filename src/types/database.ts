export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: string | null;
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  payment_method: string | null;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payu_transaction_id: string | null;
  shipping_address: Record<string, any> | null;
  notes: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Membership {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  benefits: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: number;
  user_id: string;
  membership_id: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  quantity_change: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PaymentOption {
  id: number;
  provider: "payu" | "paypal" | "paytm";
  is_enabled: boolean;
  merchant_key: string;
  merchant_salt: string | null;
  api_key: string | null;
  api_secret: string | null;
  webhook_secret: string | null;
  additional_config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
