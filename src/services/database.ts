import { supabase } from "@/lib/supabase";
import {
  Product,
  Order,
  Membership,
  UserMembership,
  InventoryLog,
  Profile,
  PaymentOption,
} from "@/types/database";

// ===== PRODUCTS =====
export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Product;
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },

  async create(product: Omit<Product, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },

  async update(id: number, product: Partial<Product>) {
    const { data, error } = await supabase
      .from("products")
      .update(product)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },

  async delete(id: number) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async updateStock(id: number, newQuantity: number) {
    const { data, error } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },
};

// ===== ORDERS =====
export const orderService = {
  async getAll() {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as any;
  },

  async create(order: Omit<Order, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();
    if (error) throw error;
    return data as Order;
  },

  async update(id: number, order: Partial<Order>) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("[DATABASE] Order update error:", error.message, error);
        throw new Error(error.message || "Failed to update order");
      }
      return data as Order;
    } catch (err) {
      console.error("[DATABASE] Order update failed:", err);
      throw err;
    }
  },

  async updateStatus(id: number, status: Order["status"]) {
    return orderService.update(id, { status });
  },

  async updatePaymentStatus(
    id: number,
    paymentStatus: Order["payment_status"],
    payuTransactionId?: string
  ) {
    const update: Partial<Order> = { payment_status: paymentStatus };
    if (payuTransactionId) {
      update.payu_transaction_id = payuTransactionId;
    }
    return orderService.update(id, update);
  },
};

// ===== ORDER ITEMS =====
export const orderItemService = {
  async addItem(
    orderId: number,
    productId: number,
    quantity: number,
    price: number
  ) {
    const { data, error } = await supabase
      .from("order_items")
      .insert([{ order_id: orderId, product_id: productId, quantity, price }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByOrderId(orderId: number) {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    if (error) throw error;
    return data;
  },
};

// ===== MEMBERSHIPS =====
export const membershipService = {
  async getAll() {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Membership[];
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Membership[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Membership;
  },

  async create(
    membership: Omit<Membership, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("memberships")
      .insert([membership])
      .select()
      .single();
    if (error) throw error;
    return data as Membership;
  },

  async update(id: number, membership: Partial<Membership>) {
    const { data, error } = await supabase
      .from("memberships")
      .update(membership)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Membership;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// ===== USER MEMBERSHIPS =====
export const userMembershipService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("user_memberships")
      .select("*, memberships(*)")
      .eq("user_id", userId)
      .order("end_date", { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  async getActiveByUserId(userId: string) {
    const { data, error } = await supabase
      .from("user_memberships")
      .select("*, memberships(*)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("end_date", { ascending: false });
    if (error) throw error;
    return data as any[];
  },

  async create(userMembership: Omit<UserMembership, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("user_memberships")
      .insert([userMembership])
      .select()
      .single();
    if (error) throw error;
    return data as UserMembership;
  },

  async update(id: number, userMembership: Partial<UserMembership>) {
    const { data, error } = await supabase
      .from("user_memberships")
      .update(userMembership)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as UserMembership;
  },
};

// ===== INVENTORY LOGS =====
export const inventoryLogService = {
  async getByProductId(productId: number) {
    const { data, error } = await supabase
      .from("inventory_logs")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as InventoryLog[];
  },

  async create(log: Omit<InventoryLog, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("inventory_logs")
      .insert([log])
      .select()
      .single();
    if (error) throw error;
    return data as InventoryLog;
  },
};

// ===== PROFILES =====
export const profileService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async create(profile: Omit<Profile, "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("profiles")
      .insert([profile])
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async update(id: string, profile: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },
};

// ===== PAYMENT OPTIONS =====
export const paymentOptionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("payment_options")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as PaymentOption[];
  },

  async getEnabled() {
    const { data, error } = await supabase
      .from("payment_options")
      .select("*")
      .eq("is_enabled", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as PaymentOption[];
  },

  async getByProvider(provider: PaymentOption["provider"]) {
    const { data, error } = await supabase
      .from("payment_options")
      .select("*")
      .eq("provider", provider)
      .single();
    if (error) throw error;
    return data as PaymentOption;
  },

  async create(
    paymentOption: Omit<PaymentOption, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("payment_options")
      .insert([paymentOption])
      .select()
      .single();
    if (error) throw error;
    return data as PaymentOption;
  },

  async update(id: number, paymentOption: Partial<PaymentOption>) {
    const { data, error } = await supabase
      .from("payment_options")
      .update(paymentOption)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as PaymentOption;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from("payment_options")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
