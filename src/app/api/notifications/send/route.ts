import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { supabase } from '@/lib/supabase';

// Helper to initialize Firebase Admin once
function getFirebaseAdmin() {
    if (admin.apps.length > 0) return admin;

    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
        console.warn('FIREBASE_SERVICE_ACCOUNT not found in environment variables.');
        return null;
    }

    try {
        // Clean the string if it was wrapped in single quotes in .env
        if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
            serviceAccount = serviceAccount.slice(1, -1);
        }

        const parsedAccount = JSON.parse(serviceAccount);
        admin.initializeApp({
            credential: admin.credential.cert(parsedAccount),
        });
        return admin;
    } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        // 1. Basic security check (Admin only)
        // In a real app we'd verify the Supabase session token from the header
        // but for now we rely on the dashboard context
        const { tokens, title, body, url } = await req.json();

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        // 2. Initialize Firebase Admin
        const firebase = getFirebaseAdmin();
        if (!firebase) {
            return NextResponse.json({
                success: false,
                error: 'Firebase Admin not configured. Please add FIREBASE_SERVICE_ACCOUNT to .env'
            }, { status: 500 });
        }

        // 3. Construct Message
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                url: url || '/',
            },
            tokens,
        };

        // 4. Send Message
        const response = await firebase.messaging().sendEachForMulticast(message);

        console.log(`Successfully sent ${response.successCount} messages.`);

        // 5. Cleanup failed tokens if needed
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error(`Token ${tokens[idx]} failed:`, resp.error);
                }
            });

            // Optional: Delete failed tokens from DB to keep it clean
            if (failedTokens.length > 0) {
                await supabase
                    .from('push_devices')
                    .delete()
                    .filter('subscription_token->>token', 'in', `(${failedTokens.join(',')})`);
            }
        }

        return NextResponse.json({
            success: true,
            count: response.successCount,
            failed: response.failureCount
        });

    } catch (error: any) {
        console.error('Error in Push API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
