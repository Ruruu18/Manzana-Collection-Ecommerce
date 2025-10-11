# Push Notification Setup Guide

## ✅ What's Already Done (Code Complete)

1. ✅ App configured for push notifications in `app.json`
2. ✅ Android channels created (default, promotions, stock_alerts, orders)
3. ✅ Notification permissions handling in `useNotifications.tsx`
4. ✅ Push token saved to user profile
5. ✅ Real-time notification listeners configured

## 🔧 What You Need to Do

### Step 1: Firebase Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create/Select Project** for Manzana Collection
3. **Add Android App**:
   - Package name: `com.manzana.collection`
   - App nickname: `Manzana Collection`
   - Click "Register app"
4. **Download `google-services.json`**:
   - Click the download button
   - Save to project root: `/Users/mharjadeenario/Desktop/Manzana-Collection/Manzana/google-services.json`

### Step 2: Get FCM Server Key

1. In Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Under "Cloud Messaging API (Legacy)", copy the **Server key**
3. Save this key securely - you'll need it for sending notifications

### Step 3: Verify File Placement

Make sure `google-services.json` is in the correct location:
```
Manzana/
├── google-services.json  ← Must be here!
├── app.json
├── package.json
└── src/
```

### Step 4: Rebuild the APK

```bash
cd /Users/mharjadeenario/Desktop/Manzana-Collection/Manzana
eas build --platform android --profile preview
```

## 📤 How to Send Push Notifications

### Option 1: Using Expo Push Notification Tool (Testing)

1. Get a user's push token from the database:
   ```sql
   SELECT push_token FROM users WHERE id = 'user-id';
   ```

2. Go to: https://expo.dev/notifications

3. Send test notification:
   - Enter the push token (starts with `ExponentPushToken[...]`)
   - Add title and message
   - Click "Send Notification"

### Option 2: Using Supabase Edge Function (Production)

Create a Supabase Edge Function to send notifications automatically:

**File: `supabase/functions/send-push-notification/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { userIds, title, body, data } = await req.json();

    // Get push tokens from database
    const { data: users, error } = await supabase
      .from('users')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (error) throw error;

    // Prepare push messages
    const messages = users.map(user => ({
      to: user.push_token,
      sound: 'default',
      title,
      body,
      data,
      channelId: data?.type || 'default', // Android channel
    }));

    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### Option 3: Trigger Notifications from Database (Automatic)

Create a Supabase database trigger to send notifications automatically:

**Example: Send notification when order status changes**

```sql
-- Function to send push notification
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification into notifications table
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read
  ) VALUES (
    NEW.user_id,
    'order_update',
    'Order Status Updated',
    'Your order #' || NEW.id || ' is now ' || NEW.status,
    jsonb_build_object('order_id', NEW.id, 'status', NEW.status),
    false
  );

  -- TODO: Call Edge Function to send push notification
  -- This requires setting up the Edge Function above

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER order_status_notification
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();
```

## 🧪 Testing Push Notifications

### Test 1: In App (Should Already Work)
1. Open app
2. Create a notification in database
3. Should appear in app immediately ✅

### Test 2: App in Background
1. Open app, then minimize (don't close)
2. Create a notification in database
3. Should receive notification ✅

### Test 3: App Completely Closed (Requires Firebase)
1. Force close the app completely
2. Create a notification in database
3. Should receive notification ✅ (Only after Firebase setup)

## 🔍 Troubleshooting

### No Notifications When App is Closed
- ❌ Missing `google-services.json` file
- ❌ APK not rebuilt after adding the file
- ❌ User didn't grant notification permissions
- ❌ Push token not saved to user profile

### Notifications Not Showing
- Check notification permissions: Settings → Apps → Manzana Collection → Notifications
- Check push token exists: `SELECT push_token FROM users WHERE id = 'user-id'`
- Check Android notification channels are created (happens on first app open)

### Firebase Cloud Messaging Errors
- Verify package name matches: `com.manzana.collection`
- Verify `google-services.json` is in project root
- Verify APK was rebuilt after adding the file

## 📱 How It Works

1. **User opens app** → Requests notification permission
2. **Permission granted** → Gets Expo push token
3. **Token saved** → Stored in `users.push_token` column
4. **Event happens** → (order status change, new promotion, etc.)
5. **Database trigger** → Creates notification in database + sends push
6. **User's device** → Receives push notification via Firebase FCM
7. **User taps notification** → App opens to relevant screen

## 🔐 Security Notes

- Never expose FCM Server Key in client code
- Use Supabase Edge Functions or backend server to send notifications
- Validate user permissions before sending notifications
- Rate limit notification sending to prevent spam
