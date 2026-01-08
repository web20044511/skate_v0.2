# Database Schema Updates Required

This document outlines the database schema changes needed to support the new features implemented in the checkout and order management system.

## Overview

The following features require new columns in the `orders` table:
1. Dynamic cart updates with customer details collection
2. Order receipt generation with customer information
3. Order status management with admin comments

## Required Column Additions to `orders` Table

Add the following columns to your Supabase `orders` table:

### 1. Customer Contact Information
```sql
-- Add customer email column
ALTER TABLE orders ADD COLUMN customer_email TEXT;

-- Add customer phone column
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
```

**Description:**
- `customer_email`: Stores the customer's email address during checkout
- `customer_phone`: Stores the customer's phone number during checkout

These fields allow the admin to quickly reference customer contact details without looking at the shipping address.

### 2. Order Status Comments
```sql
-- Add status comment column for admin notes
ALTER TABLE orders ADD COLUMN status_comment TEXT;
```

**Description:**
- `status_comment`: Stores admin comments/descriptions when updating order status
- Used to provide customers with status update information
- Appears in the "My Orders" page for the customer

## Migration Instructions

### For Supabase:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands:

```sql
-- Add customer_email column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add customer_phone column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add status_comment column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_comment TEXT;
```

### For PostgreSQL (Self-hosted):

Run the same SQL commands above in your PostgreSQL client.

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';
```

You should see `customer_email`, `customer_phone`, and `status_comment` in the results.

## Notes

- All new columns are optional (`TEXT` without `NOT NULL`)
- Existing orders will have `NULL` values for these new columns
- New orders created through the checkout flow will automatically populate `customer_email` and `customer_phone`
- The `status_comment` field is populated only when an admin updates the order status with a comment

## Troubleshooting

### "Error updating order: [object Object]"

If you see this error after implementing the new code, it likely means:
1. The `customer_email`, `customer_phone`, or `status_comment` columns don't exist in your database
2. Run the SQL migration commands above to add these columns

### Profile fetch timeout errors

These are warnings and indicate slow Supabase response times. The application has fallback mechanisms:
- The timeout has been increased from 8 seconds to 15 seconds
- If profile fetch fails, a basic customer profile is created automatically
- The application will still work, just without some profile information initially
