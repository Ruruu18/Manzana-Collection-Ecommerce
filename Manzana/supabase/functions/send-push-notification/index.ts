// Supabase Edge Function: send-push-notification
// This function sends push notifications when a notification is created in the database
// Deploy to: https://supabase.com/dashboard/project/_/functions

// @ts-ignore - Deno imports (this file is for Supabase Edge Functions, not React Native)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationPayload {
  record: {
    id: string
    user_id: string
    title: string
    message: string
    type: string
    data: any
  }
}

// @ts-ignore - serve is a Deno function
serve(async (req: Request) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get notification data from webhook
    const payload: NotificationPayload = await req.json()
    const notification = payload.record

    console.log('📬 Processing notification:', notification.id)

    // Create Supabase client
    // @ts-ignore - Deno environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore - Deno environment variables
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's device tokens
    const { data: devices, error: devicesError } = await supabase
      .from('user_devices')
      .select('device_token, platform')
      .eq('user_id', notification.user_id)

    if (devicesError) {
      console.error('Error fetching devices:', devicesError)
      return new Response('Error fetching devices', { status: 500 })
    }

    if (!devices || devices.length === 0) {
      console.log('No devices found for user:', notification.user_id)
      return new Response('No devices found', { status: 200 })
    }

    console.log(`📱 Found ${devices.length} device(s) for user`)

    // Prepare push notification messages
    const messages = devices.map((device: any) => ({
      to: device.device_token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...notification.data,
      },
      priority: 'high',
      channelId: 'default',
    }))

    // Send push notifications via Expo
    const pushResults: any[] = []

    for (const message of messages) {
      try {
        console.log('📤 Sending push notification to:', message.to.substring(0, 20) + '...')

        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })

        const result = await response.json()
        pushResults.push(result)

        console.log('✅ Push notification sent:', result)
      } catch (error: any) {
        console.error('❌ Error sending push notification:', error)
        pushResults.push({ error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: notification.id,
        deviceCount: devices.length,
        results: pushResults,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('💥 Error in send-push-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
