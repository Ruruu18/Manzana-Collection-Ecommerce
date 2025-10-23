# Check Edge Function Logs

The notification is being created in the database but not sent as a push notification.

## Steps to Check:

1. **Go to Supabase Dashboard**
   - Open your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in the left sidebar
   - Click on "send-push-notification"

3. **Check Recent Invocations**
   - Look at the logs to see if the function is being triggered
   - Check for any errors

4. **Common Issues:**

   **Issue 1: Webhook Not Triggering the Function**
   - The database trigger creates the notification
   - But the webhook might not be calling the Edge Function
   - Check: Database → Webhooks → Verify the webhook exists and is enabled

   **Issue 2: No Device Token**
   - User doesn't have a push token registered
   - Check with this SQL:
   ```sql
   SELECT * FROM user_devices WHERE user_id = '438b8028-337c-4e4d-9d42-8941...'
   ```

   **Issue 3: Edge Function Error**
   - FCM credentials issue
   - Expo Push API error
   - Check the function logs for errors

## Quick Test:

Run this in Supabase SQL Editor to manually trigger a push notification:

```sql
-- Get the user's push token
SELECT push_token FROM user_devices WHERE user_id = '438b8028-337c-4e4d-9d42-8941...';

-- If push_token exists, the Edge Function should have received it
-- Check Edge Function logs to see what happened
```

## Most Likely Issue:

The **Database Webhook** is probably not configured or not working.

### To Fix:

1. Go to Database → Webhooks in Supabase Dashboard
2. Check if webhook exists for `notifications` table
3. If not, create it:
   - **Table**: notifications
   - **Events**: INSERT
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification`
   - **HTTP Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_ANON_KEY
     ```

If webhook exists, check if it's enabled and has recent successful invocations.
