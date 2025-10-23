# Verify Database Webhook Setup

The notification is being created in the database but not sent as a push notification.

## Check Webhook Configuration:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click **Database** → **Webhooks** in left sidebar

2. **Look for webhook on `notifications` table**
   - Should have these settings:
     - **Table**: `public.notifications`
     - **Events**: `INSERT`
     - **Type**: HTTP Request
     - **Method**: POST
     - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification`

3. **Check webhook status**
   - Is it **Enabled**?
   - Check **Recent deliveries** - any errors?

## If webhook doesn't exist, create it:

### Manual Creation via Dashboard:
1. Click **"Create a new hook"**
2. Fill in:
   - **Name**: `send-push-on-notification`
   - **Table**: `notifications`
   - **Events**: Check `INSERT`
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: Get your project URL from Settings → API, then add `/functions/v1/send-push-notification`
   - **HTTP Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_ANON_KEY
     ```
   - **HTTP Params**: Leave empty

### OR via SQL:

```sql
-- Check if webhook exists
SELECT * FROM supabase_functions.hooks
WHERE table_name = 'notifications';

-- If it doesn't exist, you need to create it via Supabase Dashboard
-- (webhooks can't be created via SQL, only through Dashboard or API)
```

## Alternative: Check if Edge Function is deployed

Run this to verify:
```bash
supabase functions list
```

Should show `send-push-notification` as deployed.

## Most Common Issue:

The webhook was created but is using the **wrong URL** or **wrong authorization key**.

Double-check:
1. URL format: `https://PROJECT_REF.supabase.co/functions/v1/send-push-notification`
2. Authorization header uses your **anon key** (not service role key)
3. Webhook is **enabled**

## Test the Edge Function Directly:

You can test if the edge function works by calling it manually:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "record": {
      "id": "test-id",
      "user_id": "438b8028-337c-4e4d-9d42-8941...",
      "title": "Test Notification",
      "message": "Testing push notification",
      "type": "test"
    }
  }'
```

If this works and sends a push notification, then the webhook configuration is the problem.
