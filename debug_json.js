
const fs = require('fs');
const content = fs.readFileSync('/Users/frikilabs/Desktop/envlocal.txt', 'utf8');
const line = content.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT='));
if (line) {
    let val = line.split('=')[1];
    // Strip single quotes
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

    // Attempt to fix common corruption issues
    let fixed = val
        .replace(/\\"/g, '"') // Replace escaped quotes with real ones
        .replace(/\\n/g, '\n'); // Replace escaped newlines with real ones

    // Add missing closing brace if not there
    if (!fixed.endsWith('}')) fixed += '}';

    console.log("FIXED JSON START:");
    console.log(fixed);
    console.log("FIXED JSON END");

    try {
        JSON.parse(fixed);
        console.log("VALIDATION: SUCCESS");
    } catch (e) {
        console.log("VALIDATION: FAILED", e.message);
    }
} else {
    console.log("LINE NOT FOUND");
}
