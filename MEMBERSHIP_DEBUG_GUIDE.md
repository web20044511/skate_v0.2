# 🔍 Membership Debug Guide

## Quick Diagnosis Steps

### Step 1: Access the Debug Page
Navigate to: **http://localhost:8080/test/membership-debug**

### Step 2: Run the Tests in Order

#### Test 1️⃣: **Check if Database Tables Exist**
Click the "**1️⃣ Test Tables Exist**" button
- **Expected Output**: ✅ for all three tables
  - ✅ Memberships table exists
  - ✅ User_memberships table exists  
  - ✅ Payment_transactions table exists

**If you see ❌ errors:**
- The table doesn't exist in your Supabase database
- See "Database Setup" section below

#### Test 2️⃣: **Check Your Current Memberships**
First, make sure you're logged in as a regular user (not admin)
Then click "**2️⃣ Check Your Memberships**"

**Expected Output**: 
- ✅ Found 0 membership(s) (if you haven't purchased any yet)
- ✅ Found 1+ membership(s) (if you've purchased before)

**If you see ❌ errors:**
- Your user ID isn't set correctly
- The user_memberships table has RLS policies blocking reads

#### Test 3️⃣: **Simulate a Complete Purchase**
Click "**3️⃣ Simulate Purchase**"

This will:
1. Find the first available membership in your database
2. Create a test order with that membership
3. Simulate payment processing
4. Check if the membership appears after processing

**Expected Output**:
- ✅ Order created: [id]
- ✅ Found membership: [name] (ID: [id])
- ✅ Payment result: success
- ✅ User now has 1 membership(s)

---

## What the Debug Results Mean

### ✅ All Tests Pass
Your system is working! The issue might be:
- User forgot to complete checkout
- Browser cache issue - try clearing cache
- Multiple tab issue - refresh the page

**Solution**: Go to `/profile`, click "Refresh" button, and check if membership appears

---

### ❌ Test 1 Fails - Table Doesn't Exist

**Error**: "Error: relation does not exist"

This means the database table wasn't created in Supabase.

**How to Fix - Create the Tables in Supabase:**

1. Go to https://app.supabase.com
2. Find your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL below:

```sql
-- Create user_memberships table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id BIGINT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_transactions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  hash TEXT,
  status TEXT DEFAULT 'initiated',
  simulated BOOLEAN DEFAULT false,
  payu_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_membership_id ON user_memberships(membership_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- Enable RLS
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for user_memberships
-- Users can see their own memberships
CREATE POLICY "Users can view their own memberships"
  ON user_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can create memberships
CREATE POLICY "Service role can create memberships"
  ON user_memberships
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own memberships
CREATE POLICY "Users can update their own memberships"
  ON user_memberships
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS Policies for payment_transactions
-- Users can see transactions related to their orders
CREATE POLICY "Users can view their payment transactions"
  ON payment_transactions
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Service role (backend) can create transactions
CREATE POLICY "Service role can create transactions"
  ON payment_transactions
  FOR INSERT
  WITH CHECK (true);
```

6. Click **Run** or press **Ctrl+Enter**
7. Go back to the debug page and run Test 1️⃣ again

---

### ❌ Test 2 Fails - Cannot Read Memberships

**Error**: "Error: new row violates row-level security policy" or "Error: permission denied"

This means the RLS policy is blocking reads.

**How to Fix:**

1. Go to Supabase SQL Editor again
2. Run this query:

```sql
-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'user_memberships';
```

3. You should see the policies created above
4. If not, re-run the CREATE POLICY commands from Test 1 solution
5. Go back and try Test 2️⃣ again

---

### ❌ Test 3 Fails - Cannot Create Payment Transaction

**Error**: "Error: new row violates row-level security policy" for payment_transactions

This is because the service role needs permission to insert transactions.

**How to Fix:**

The RLS policies created in Test 1 should allow this. If still failing:

1. Go to Supabase → Authentication → Policies
2. Verify that the policies exist:
   - `payment_transactions`: "Service role can create transactions"
3. If missing, re-run the CREATE POLICY commands from Test 1

---

### ❌ Test 3 Fails - Missing Membership ID

**Error**: "No memberships found in database"

This means you haven't created any memberships yet.

**How to Fix:**

1. Go to `/admin/memberships` (Admin → Memberships)
2. Click **Create New Membership**
3. Fill in the details:
   - Name: "Silver Tier"
   - Price: 499
   - Duration: 30 days
   - Benefits: Add some benefits
   - Color: silver
   - Icon: Star
4. Click **Create**
5. Go back to debug page and try Test 3️⃣ again

---

## After Database is Set Up

### Complete Testing Flow

1. ✅ Pass all 3 debug tests
2. Go to `/programme` and add a membership to cart
3. Go to `/checkout` and complete payment
4. You should be redirected to `/orders` with success message
5. Go to `/profile` and click **Refresh**
6. Your membership should appear in the "My Memberships" section

### If Membership Still Doesn't Appear

**Check the browser console:**
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for messages starting with:
   - `[CHECKOUT]` - membership extraction logs
   - `[PAYMENT]` - payment processing logs
   - `[PROFILE]` - membership loading logs

**Common Issues:**

| Error | Solution |
|-------|----------|
| `[CHECKOUT] Missing membershipId for item` | membership not added correctly to cart |
| `[PAYMENT] ❌ Membership X not found` | Invalid membership ID in order |
| `[PAYMENT] ❌ Error fetching order` | Order wasn't created properly |
| `[PROFILE] Loaded 0 memberships` | user_membership records weren't created |

---

## Manual Check in Supabase

If you want to verify data directly:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Check all user memberships
SELECT 
  um.id,
  um.user_id,
  um.membership_id,
  m.name,
  um.start_date,
  um.end_date,
  um.is_active,
  p.email
FROM user_memberships um
LEFT JOIN memberships m ON m.id = um.membership_id
LEFT JOIN profiles p ON p.id = um.user_id
ORDER BY um.created_at DESC
LIMIT 20;
```

This will show you all memberships in the system and which user owns them.

---

## Still Not Working?

If you've done all the above and memberships still aren't showing:

1. **Copy all console logs** (F12 → Console)
2. **Take a screenshot** of the debug page results
3. **Share the issue** with the exact error messages

This will help diagnose the specific problem in your setup.
