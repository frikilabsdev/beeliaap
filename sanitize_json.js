
const fs = require('fs');
const content = fs.readFileSync('/Users/frikilabs/Desktop/envlocal.txt', 'utf8');
const lines = content.split('\n');
const line = lines.find(l => l.includes('FIREBASE_SERVICE_ACCOUNT='));

if (!line) {
    console.log("Error: Line not found");
    process.exit(1);
}

let val = line.substring(line.indexOf('=') + 1).trim();

// Handle external single quotes
if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1);
}

// Fix common corruption/escaping issues
let parsed = val;
try {
    // If it was double-escaped (e.g. \" instead of ")
    if (parsed.includes('\\"')) {
        parsed = parsed.replace(/\\"/g, '"');
    }

    // Ensure newlines in the private key are handled
    // The source might have literal \n string
    if (parsed.includes('\\n')) {
        // We'll leave them for now because JSON.parse expects literal \n as \n characters
    }

    // Attempt to add missing closing brace if truncated
    if (!parsed.trim().endsWith('}')) {
        parsed = parsed.trim() + '}';
    }

    const obj = JSON.parse(parsed);
    console.log("---- CLEAN JSON START ----");
    console.log(JSON.stringify(obj, null, 2));
    console.log("---- CLEAN JSON END ----");

    console.log("\n---- ONE-LINE VERSION FOR VERCEL ----");
    console.log(JSON.stringify(obj));
    console.log("---- END ----");

} catch (e) {
    console.log("Failed to parse/fix JSON:");
    console.log("Raw value being parsed:", parsed);
    console.log("Error:", e.message);
}
