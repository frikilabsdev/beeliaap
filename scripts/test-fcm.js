const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Extract env vars from .env.local manually for this script
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const getEnv = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].replace(/^['"]|['"]$/g, '') : null;
};

const serviceAccount = require('/Users/frikilabs/Downloads/beelia-linktree-firebase-adminsdk-fbsvc-6c3b41ca1d.json');

// The most recent token from Supabase (ID 8)
const testToken = "eMqXeCIX5-MPIfO2dJxu1v:APA91bHNE86FLk00Hzsfw8juyWT7GI0tH8Qd7VQMtVrjHY-qg_0B868wflECQBFWiB6NOyLYKs_higOKEr1SfI6WWUqUnRf4Wn-djoVvZc-DVjVltfbHyqo";

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    const message = {
        notification: {
            title: 'Test con Metadatos',
            body: 'Si ves esto, la estructura es correcta.',
        },
        data: {
            url: '/',
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                clickAction: '/',
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
                link: '/'
            }
        },
        token: testToken,
    };

    console.log('Enviando mensaje...');
    admin.messaging().send(message)
        .then((response) => {
            console.log('✅ EXITO:', response);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ ERROR:', error);
            process.exit(1);
        });
} catch (e) {
    console.error('Initial error:', e);
}
