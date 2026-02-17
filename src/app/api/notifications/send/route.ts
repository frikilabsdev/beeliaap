import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { supabase } from '@/lib/supabase';

// Helper to initialize Firebase Admin once
function getFirebaseAdmin(): any {
    if (admin.apps.length > 0) return admin;

    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount || serviceAccount.length === 0) {
        return { error: 'FIREBASE_SERVICE_ACCOUNT is missing in environment variables.' };
    }

    try {
        // Clean potential whitespace and quotes
        let cleanedAccount = serviceAccount.trim();
        if (cleanedAccount.startsWith("'") && cleanedAccount.endsWith("'")) {
            cleanedAccount = cleanedAccount.slice(1, -1);
        } else if (cleanedAccount.startsWith('"') && cleanedAccount.endsWith('"')) {
            cleanedAccount = cleanedAccount.slice(1, -1);
        }

        const parsedAccount = JSON.parse(cleanedAccount);

        // Robustness: ensure common escaping issues with private_key (like literal \n) are fixed
        if (parsedAccount.private_key) {
            parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(parsedAccount),
        });
        return admin;
    } catch (parseError: any) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', parseError);
        return { error: `JSON Parse Error: ${parseError.message}` };
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
        const firebaseResult = getFirebaseAdmin();
        if ('error' in firebaseResult) {
            return NextResponse.json({
                success: false,
                error: firebaseResult.error
            }, { status: 500 });
        }
        const firebase = firebaseResult;

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
            response.responses.forEach((resp: any, idx: number) => {
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
