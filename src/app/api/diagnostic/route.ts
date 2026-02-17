import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        senderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        hasDedicatedKey: !!process.env.FIREBASE_PRIVATE_KEY,
        env: process.env.NODE_ENV
    });
}
