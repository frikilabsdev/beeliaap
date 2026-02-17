import { supabase } from "@/lib/supabase";

export async function sendPushNotification(title: string, body: string, url: string = "/") {
    try {
        // 1. Get all subscribed devices
        const { data: devices, error: deviceError } = await supabase
            .from("push_devices")
            .select("id, subscription_token");

        if (deviceError) throw deviceError;
        if (!devices || devices.length === 0) return { success: true, count: 0 };

        // 2. Extract tokens from the JSONB column
        // In schema.sql: subscription_token JSONB UNIQUE NOT NULL
        const tokens = devices.map(d => d.subscription_token.token).filter(t => !!t);

        if (tokens.length === 0) return { success: true, count: 0 };

        console.log(`Attempting to send push to ${tokens.length} devices...`);

        // 3. Instead of direct simulation, we call the API route
        // This keeps the client/admin side simple and secure
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens,
                title,
                body,
                url
            })
        });

        const result = await response.json();

        if (!result.success) throw new Error(result.error);

        // 3. Log the notification
        const { error: logError } = await supabase
            .from("notification_log")
            .insert({
                title,
                body,
                target_url: url,
                sent_count: tokens.length,
                status: 'sent'
            });

        if (logError) throw logError;

        return { success: true, count: tokens.length };
    } catch (error) {
        console.error("Error in sendPushNotification:", error);
        return { success: false, error };
    }
}
