# Order Status Notifications - Setup & Testing Guide

## ✅ What's Been Implemented

### 1. Database Trigger (Automatic Notifications)
- **File**: `add-order-status-notifications.sql`
- **Purpose**: Automatically creates notifications when order status changes
- **Trigger Name**: `order_status_notification_trigger`

### 2. Order Service Update
- **File**: `src/services/orders.ts`
- **New Function**: `updateOrderStatus(orderId, newStatus)`
- **Purpose**: Updates order status and triggers automatic notification

### 3. Notification Messages by Status

| Status | Title | Message |
|--------|-------|---------|
| **confirmed** | ✅ Order Confirmed! | Your order #{number} has been confirmed. We are preparing your items. |
| **processing** | 📦 Order Processing | Your order #{number} is being processed and prepared. |
| **ready** | 🎉 Order Ready for Pickup! | Your order #{number} is ready! Please pick it up at your scheduled time. |
| **completed** | ✨ Order Completed | Thank you for picking up order #{number}! We hope to see you again soon. |
| **cancelled** | ❌ Order Cancelled | Your order #{number} has been cancelled. |

## 🔧 Setup Instructions

### Step 1: Run SQL Migration

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor**:
   - Click "SQL Editor" in left sidebar
   - Click "New Query"
3. **Copy & Paste** the contents of `add-order-status-notifications.sql`
4. **Run the Query** (Click "Run" button)
5. **Verify Success**: Should see "Success. No rows returned"

### Step 2: Verify Trigger is Created

Run this query to check:

```sql
-- Check if trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'order_status_notification_trigger';
```

Expected result: Should show one row with trigger details.

### Step 3: Grant Permissions (if needed)

```sql
-- Ensure users table has proper RLS policies
-- Allow authenticated users to insert notifications (via trigger)
CREATE POLICY IF NOT EXISTS "Allow trigger to insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);
```

## 🧪 Testing Order Status Notifications

### Test 1: Update Order Status Manually

1. **Get an existing order ID**:
   ```sql
   SELECT id, order_number, status, user_id
   FROM orders
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Update status to 'confirmed'**:
   ```sql
   UPDATE orders
   SET status = 'confirmed'
   WHERE id = 'your-order-id';
   ```

3. **Check if notification was created**:
   ```sql
   SELECT * FROM notifications
   WHERE user_id = 'user-id-from-order'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   Expected: Should see notification with title "✅ Order Confirmed!"

### Test 2: Test All Status Transitions

Run these updates one by one:

```sql
-- 1. Confirm order
UPDATE orders SET status = 'confirmed' WHERE id = 'order-id';

-- 2. Start processing
UPDATE orders SET status = 'processing' WHERE id = 'order-id';

-- 3. Mark as ready
UPDATE orders SET status = 'ready' WHERE id = 'order-id';

-- 4. Complete order
UPDATE orders SET status = 'completed' WHERE id = 'order-id';
```

After each update, check notifications:

```sql
SELECT title, message, created_at
FROM notifications
WHERE data->>'order_id' = 'order-id'
ORDER BY created_at DESC;
```

Expected: Should see 4 notifications, one for each status change.

### Test 3: Test from App (Using orderService)

Create a test admin screen or use browser console:

```typescript
import { orderService } from './services/orders';

// Update order status
const result = await orderService.updateOrderStatus(
  'order-id-here',
  'confirmed'
);

console.log('Status updated:', result);

// Check if notification was created
// User should receive notification in their app
```

### Test 4: Full Workflow Test

1. **Place an order** (as customer)
   - Should receive: "✅ Order Placed Successfully!"

2. **Admin confirms order** (update status)
   ```typescript
   await orderService.updateOrderStatus(orderId, 'confirmed');
   ```
   - Customer should receive: "✅ Order Confirmed!"

3. **Admin starts processing**
   ```typescript
   await orderService.updateOrderStatus(orderId, 'processing');
   ```
   - Customer should receive: "📦 Order Processing"

4. **Admin marks ready**
   ```typescript
   await orderService.updateOrderStatus(orderId, 'ready');
   ```
   - Customer should receive: "🎉 Order Ready for Pickup!"

5. **Customer picks up, admin completes**
   ```typescript
   await orderService.updateOrderStatus(orderId, 'completed');
   ```
   - Customer should receive: "✨ Order Completed"

## 📱 How to Use in Your App

### For Admin/Staff Screens

```typescript
import { orderService } from '../services/orders';
import { Alert } from 'react-native';

const handleUpdateStatus = async (orderId: string, newStatus: string) => {
  const { data, error } = await orderService.updateOrderStatus(
    orderId,
    newStatus as any
  );

  if (error) {
    Alert.alert('Error', error);
    return;
  }

  Alert.alert('Success', `Order status updated to ${newStatus}`);
  // Notification is automatically created by database trigger
  // Customer will receive it in real-time
};
```

### Sample Admin UI Component

```typescript
const OrderStatusButtons = ({ order }) => {
  const updateStatus = async (status: string) => {
    const result = await orderService.updateOrderStatus(order.id, status);
    if (!result.error) {
      Alert.alert('Success', 'Status updated and customer notified!');
    }
  };

  return (
    <View>
      {order.status === 'pending' && (
        <Button title="✅ Confirm Order" onPress={() => updateStatus('confirmed')} />
      )}

      {order.status === 'confirmed' && (
        <Button title="📦 Start Processing" onPress={() => updateStatus('processing')} />
      )}

      {order.status === 'processing' && (
        <Button title="🎉 Mark Ready" onPress={() => updateStatus('ready')} />
      )}

      {order.status === 'ready' && (
        <Button title="✨ Complete Order" onPress={() => updateStatus('completed')} />
      )}
    </View>
  );
};
```

## 🔍 Troubleshooting

### Notifications Not Being Created

1. **Check trigger exists**:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'order_status_notification_trigger';
   ```

2. **Check function exists**:
   ```sql
   SELECT proname FROM pg_proc
   WHERE proname = 'notify_order_status_change';
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'notifications';
   ```

4. **Test trigger manually**:
   ```sql
   -- Enable logging
   SET client_min_messages TO NOTICE;

   -- Update order
   UPDATE orders SET status = 'confirmed' WHERE id = 'test-order-id';

   -- Check logs for NOTICE messages
   ```

### Notifications Created But Not Received

1. **Check push token exists**:
   ```sql
   SELECT id, email, push_token
   FROM users
   WHERE id = 'user-id';
   ```

2. **Check notification in database**:
   ```sql
   SELECT * FROM notifications
   WHERE user_id = 'user-id'
   ORDER BY created_at DESC;
   ```

3. **Verify real-time subscription** is active in app
4. **Check notification permissions** on device

## 🎯 Expected Behavior

### When Order Status Changes:

1. ✅ **Database**: Order status updated in `orders` table
2. ✅ **Trigger Fires**: `notify_order_status_change()` function runs
3. ✅ **Notification Created**: New row inserted in `notifications` table
4. ✅ **Real-time Event**: Supabase broadcasts INSERT event
5. ✅ **App Receives**: `useNotifications` hook catches the event
6. ✅ **Local Notification**: Shown on device (even if app is closed with FCM)
7. ✅ **UI Updates**: Notification appears in notifications screen

### Notification Flow:

```
Admin Updates Status → Database Trigger → Create Notification
                                              ↓
                                    Supabase Realtime
                                              ↓
                                    Customer's Device
                                              ↓
                          Push Notification (via FCM if app closed)
                                              ↓
                                    Notification Badge Updated
```

## 📊 Monitoring

### Check Recent Notifications

```sql
SELECT
    n.created_at,
    n.title,
    n.message,
    u.full_name as user_name,
    n.data->>'order_number' as order_number,
    n.data->>'new_status' as new_status,
    n.is_read
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type = 'order_update'
ORDER BY n.created_at DESC
LIMIT 20;
```

### Count Notifications by Status

```sql
SELECT
    data->>'new_status' as status,
    COUNT(*) as notification_count
FROM notifications
WHERE type = 'order_update'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY data->>'new_status'
ORDER BY notification_count DESC;
```

## ✨ Done!

Once you run the SQL migration, order status notifications will work automatically!

Every time an admin/staff updates an order status using `orderService.updateOrderStatus()`, the customer will automatically receive a notification.
