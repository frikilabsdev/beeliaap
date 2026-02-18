const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Robust .env parsing
function getServiceAccount() {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Find the line starting with FIREBASE_SERVICE_ACCOUNT=
    const lines = envContent.split('\n');
    const accountLine = lines.find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT='));

    if (!accountLine) throw new Error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');

    // Extract everything after the first '='
    let raw = accountLine.substring(accountLine.indexOf('=') + 1).trim();

    // Remove wrapping single/double quotes if present
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
        raw = raw.slice(1, -1);
    }

    // The string in .env might have escaped newlines as literal \n
    // We need to make sure JSON.parse sees them correctly
    return JSON.parse(raw);
}

const tokens = [
    "dXtNgrbvQGEc3wuxeUAso3:APA91bEUoQEkpZ0APanlT7XvLEod21BUHBYDlvuLL6VxEhIa7AqVsP7TGtFGkFE_LBEFTQwHD7jLbdW7N7TZJ8RL76q72WK6veh_UUWOI3HSmqcsNxh6ETQ",
    "d3pEyoJurO6txPtwrWv2pj:APA91bGZymZCUeQIr_op1y-AfQfvmaP1BPIVbsNIpGHtjWQrhQY2tKi5-s1rphdXZnKfwMsX2_c6LKbA10-KUEmxAAM2WhhIwRc0qyBEqHah5FoD-QDehbM",
    "dEylvKzDgGIB8NmCYAlbLB:APA91bGgAyX-60BLjhVwhKVcYuCpLAgB_tP1z2ItRIuEHzCwfZbkFPl0ACIRtqetHNsCwSKpavZijhwM10u4xCsqEkDZUHoeiFMze1N-att2CwC56NZL7SU",
    "fipZ7pZ6x0Q93V1sjFVGqh:APA91bHkfWWlaqKIIn9bXHV1QwNF9BWnTKwpYORfXAxvtjzryfdG9N3ZGelyY7mrrTMH9ohYUOQ2qS47g5ZUB0brrFCRpTT3BEl72ok42Z2C96NUkA6FzLo",
    "eMqXeCIX5-MPIfO2dJxu1v:APA91bHNE86FLk00Hzsfw8juyWT7GI0tH8Qd7VQMtVrjHY-qg_0B868wflECQBFWiB6NOyLYKs_higOKEr1SfI6WWUqUnRf4Wn-djoVvZc-DVjVltfbHyqo"
];

async function run() {
    try {
        const serviceAccount = getServiceAccount();

        // Clean private key (literal \n to real newlines)
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        const message = {
            notification: {
                title: 'Audit Multi-Dispositivo',
                body: `Enviando prueba a ${tokens.length} tokens registrados.`,
            },
            tokens: tokens,
        };

        console.log('🚀 Iniciando envío multicast...');
        const response = await admin.messaging().sendEachForMulticast(message);

        console.log('\n--- RESULTADOS DEL AUDIT ---');
        console.log(`✅ Éxitos: ${response.successCount}`);
        console.log(`❌ Fallos: ${response.failureCount}`);

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.log(`[Token ${idx}] ERROR: ${resp.error.code} - ${resp.error.message}`);
            } else {
                console.log(`[Token ${idx}] OK: ${resp.messageId}`);
            }
        });

    } catch (e) {
        console.error('❌ Error fatal en el script:', e.message);
    }
}

run();
