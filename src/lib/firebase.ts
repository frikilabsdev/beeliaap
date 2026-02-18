import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

async function getMessagingInstance() {
    if (typeof window === "undefined") return null;
    const supported = await isSupported();
    if (!supported) {
        console.warn("Firebase Messaging is not supported in this browser/environment.");
        return null;
    }
    if (!messagingInstance) {
        messagingInstance = getMessaging(app);
    }
    return messagingInstance;
}

export const requestForToken = async () => {
    try {
        const messaging = await getMessagingInstance();
        if (!messaging) return null;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('VAPID Key is missing in environment variables.');
            return null;
        }

        // Explicitly register service worker for better reliability in PWA mode
        let currentToken = null;
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;
            console.log('SW Registered explicitly:', registration.scope);
            currentToken = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
            });
        } else {
            // Fallback for non-SW environments (though required for push)
            currentToken = await getToken(messaging, { vapidKey });
        }

        if (currentToken) {
            console.log('Token received:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        getMessagingInstance().then((messaging) => {
            if (!messaging) return;
            onMessage(messaging, (payload: any) => {
                resolve(payload);
            });
        }).catch((error) => {
            console.error("Error initializing onMessage listener:", error);
        });
    });
