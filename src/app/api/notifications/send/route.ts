import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { supabase } from '@/lib/supabase';

// Helper to initialize Firebase Admin once
function getFirebaseAdmin(): any {
    if (admin.apps.length > 0) return admin;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // 1. Try dedicated variables (Vercel best practice)
    if (projectId && clientEmail && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            return admin;
        } catch (e: any) {
            console.error('Firebase Init Error (Dedicated):', e);
            // Don't return yet, try JSON fallback
        }
    }

    // 2. Fallback to JSON if dedicated variables are missing
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
        try {
            let cleanedAccount = serviceAccount.trim();
            if (cleanedAccount.startsWith("'") && cleanedAccount.endsWith("'")) {
                cleanedAccount = cleanedAccount.slice(1, -1);
            }
            const parsedAccount = JSON.parse(cleanedAccount);

            // Apply the same cleaning to the fallback JSON key
            if (parsedAccount.private_key) {
                let rawKey = parsedAccount.private_key.replace(/\\n/g, '\n');
                const startMarker = '-----BEGIN PRIVATE KEY-----';
                const endMarker = '-----END PRIVATE KEY-----';
                let base64Part = rawKey;
                if (rawKey.includes(startMarker)) base64Part = rawKey.split(startMarker)[1];
                if (base64Part.includes(endMarker)) base64Part = base64Part.split(endMarker)[0];
                const cleanBase64 = base64Part.replace(/\s/g, '').replace(/["',]/g, '').trim();
                parsedAccount.private_key = `${startMarker}\n${cleanBase64}\n${endMarker}\n`;
            }

            admin.initializeApp({
                credential: admin.credential.cert(parsedAccount),
            });
            return admin;
        } catch (e: any) {
            console.error('Firebase Init Error (JSON):', e);
            return { error: `Firebase Init Failed: ${e.message}` };
        }
    }

    return { error: 'Firebase Admin not configured. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.' };
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

        // 3. Construct Message with High Priority for delivery
        const message: any = {
            notification: {
                title,
                body,
            },
            data: {
                url: url || '/',
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: url || '/',
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        'content-available': 1
                    }
                }
            },
            webpush: {
                fcmOptions: {
                    link: url || '/'
                }
            },
            tokens,
        };

        // 4. Send Message
        console.log('--- FCM STEP 1: Payload constructed');
        console.log('FCM Payload:', JSON.stringify(message, null, 2));

        console.log('--- FCM STEP 2: Calling sendEachForMulticast...');
        const startTime = Date.now();
        const response = await firebase.messaging().sendEachForMulticast(message);
        const duration = Date.now() - startTime;

        console.log(`--- FCM STEP 3: Response received in ${duration}ms`);
        console.log(`FCM Response Summary: Success=${response.successCount}, Failure=${response.failureCount}`);

        // 5. Cleanup failed tokens if needed
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error(`Token Index ${idx} [${tokens[idx].substring(0, 10)}...] failed with code: ${resp.error?.code}`);
                    console.error(`Full error:`, JSON.stringify(resp.error, null, 2));
                } else {
                    console.log(`Token Index ${idx} succeeded: ${resp.messageId}`);
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
