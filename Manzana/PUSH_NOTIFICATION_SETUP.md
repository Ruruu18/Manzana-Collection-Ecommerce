# 🔔 Push Notification Setup Guide

## ✅ What's Been Fixed

All code issues have been resolved:
- ✅ Column name mismatch fixed (`device_token` instead of `push_token`)
- ✅ Duplicate notification handlers removed
- ✅ Background notification support added
- ✅ Multi-device support working
- ✅ Notification type enum updated
- ✅ Cart screen errors fixed
- ✅ Missing notification behavior properties added

## 🚨 CRITICAL: Database Webhook Required

Your push notifications **will NOT work** until you configure the database webhook. This is the missing piece!

### Why Webhook is Needed

```
[Notification Created in DB] → [Webhook Triggers] → [Edge Function] → [Expo Push API] → [Device]
                                      ❌ MISSING!
```

Without the webhook, notifications are created in the database but never sent to devices.

---

## 📱 Setup Instructions

### Step 1: Configure Database Webhook

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/fuqsweradcynpbgarwoc
   ```

2. **Navigate to Database → Webhooks**
   - Click on "Database" in the left sidebar
   - Click on "Webhooks"

3. **Create New Webhook**
   - Click **"Create a new hook"** button

4. **Fill in the following details:**

   **Name:**
   ```
   send-push-on-notification
   ```

   **Table:**
   ```
   notifications
   ```

   **Events:** (Check this box)
   ```
   ☑ INSERT
   ```

   **Type:**
   ```
   HTTP Request
   ```

   **Method:**
   ```
   POST
   ```

   **URL:**
   ```
   https://fuqsweradcynpbgarwoc.supabase.co/functions/v1/send-push-notification
   ```

   **HTTP Headers:**
   ```
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXN3ZXJhZGN5bnBiZ2Fyd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTQ2MzcsImV4cCI6MjA3MzE3MDYzN30.bEUieVgxnM1xaBgMaj8AM07vSbdKP_Ti_pWKUGULXzI
   ```

   **HTTP Params:** (Leave empty)

   **Timeout:** (Default is fine)
   ```
   1000
   ```

5. **Click "Create webhook"**

6. **Verify it's enabled**
   - Make sure the webhook shows as "Enabled" in the list

---

### Step 2: Verify Edge Function is Deployed

Check if your edge function exists:

```bash
# List all edge functions
supabase functions list
```

You should see `send-push-notification` in the list.

If not deployed, deploy it:

```bash
cd /Users/mharjadeenario/Desktop/Manzana-Collection/Manzana
supabase functions deploy send-push-notification
```

---

### Step 3: Rebuild Mobile App

The code changes require a rebuild:

```bash
# Clean and rebuild
npx expo prebuild --clean

# Run on Android
npm run android

# OR run on iOS
npm run ios
```

---

### Step 4: Test Push Notifications

#### A. Test While App is Open

1. **Login** to your mobile app
2. **Check logs** - you should see:
   ```
   ✅ Expo Push Token: ExponentPushToken[...]
   📱 Registering device token for user: [user-id]
   ✅ Device token registered successfully!
   ```

3. **Send a test notification** from admin panel

4. **Notification should appear immediately**

#### B. Test While App is Closed (CRITICAL TEST)

1. **Login** to register your token
2. **Close the app completely** (swipe away from recent apps)
3. **Send a test notification** from admin panel
4. **Notification should appear even when app is closed!** 🎉

---

## 🔍 Troubleshooting

### Issue 1: Webhook Not Triggering

**Check webhook status:**
1. Go to Database → Webhooks
2. Click on your webhook
3. Check "Recent deliveries"
4. Look for errors

**Common errors:**
- ❌ Wrong URL (check it matches exactly)
- ❌ Wrong Authorization token
- ❌ Webhook is disabled

### Issue 2: Edge Function Errors

**Check edge function logs:**
1. Go to Edge Functions → send-push-notification
2. Click "Logs" tab
3. Look for errors when notification is created

**Common errors:**
- ❌ No device tokens found (user not logged in or token not saved)
- ❌ Invalid Expo Push Token format
- ❌ Expo Push API error

### Issue 3: No Device Token Saved

**Check if token is saved:**
```sql
SELECT * FROM user_devices WHERE user_id = 'YOUR_USER_ID';
```

**If no rows:**
- User hasn't logged in since the fix
- App permission denied
- Device doesn't support push notifications (emulator)

---

## 🧪 Manual Test: Call Edge Function Directly

Test if the edge function works without the webhook:

```bash
curl -X POST 'https://fuqsweradcynpbgarwoc.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXN3ZXJhZGN5bnBiZ2Fyd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTQ2MzcsImV4cCI6MjA3MzE3MDYzN30.bEUieVgxnM1xaBgMaj8AM07vSbdKP_Ti_pWKUGULXzI' \
  -H 'Content-Type: application/json' \
  -d '{
    "record": {
      "id": "test-123",
      "user_id": "YOUR_USER_ID",
      "title": "Test Notification",
      "message": "Testing push notification",
      "type": "general"
    }
  }'
```

Replace `YOUR_USER_ID` with your actual user ID.

**Expected response:**
```json
{
  "success": true,
  "notificationId": "test-123",
  "deviceCount": 1,
  "results": [...]
}
```

If this works but normal notifications don't, the webhook is the problem.

---

## 📊 How Multi-Device Works

Your app supports **multiple devices per user**:

```
user_devices table:
┌─────────┬─────────┬───────────────┬──────────┐
│ id      │ user_id │ device_token  │ platform │
├─────────┼─────────┼───────────────┼──────────┤
│ uuid-1  │ user-A  │ token-phone   │ android  │
│ uuid-2  │ user-A  │ token-tablet  │ android  │
│ uuid-3  │ user-A  │ token-iphone  │ ios      │
└─────────┴─────────┴───────────────┴──────────┘
```

When a notification is sent:
1. Edge function queries ALL devices for that user
2. Sends push notification to EACH device
3. All devices receive the notification

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] Database webhook is created and enabled
- [ ] Edge function is deployed
- [ ] Mobile app is rebuilt with latest code
- [ ] User has logged in (to register device token)
- [ ] Device token appears in `user_devices` table
- [ ] Notification permissions are granted on device

---

## 🎯 Expected Behavior After Setup

1. **User logs in** → Device token saved to `user_devices` table
2. **Admin creates notification** → Notification inserted into `notifications` table
3. **Webhook triggers** → Calls edge function with notification data
4. **Edge function executes** → Queries user's device tokens
5. **Push notification sent** → Via Expo Push API
6. **User receives notification** → Even if app is closed! 🎉

---

## 📝 Next Steps

1. ✅ Configure the database webhook (CRITICAL!)
2. ✅ Deploy edge function if not already deployed
3. ✅ Rebuild mobile app
4. ✅ Test notifications with app open
5. ✅ Test notifications with app closed
6. ✅ Test on multiple devices

---

## 🆘 Still Not Working?

If you followed all steps and it still doesn't work:

1. **Check webhook deliveries** in Supabase Dashboard
2. **Check edge function logs** for errors
3. **Check device tokens** in user_devices table
4. **Test edge function manually** with curl
5. **Verify app has notification permissions**

The most common issue is the webhook not being configured!
