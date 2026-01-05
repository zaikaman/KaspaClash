
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'node_modules', 'kaspalib', 'lib', 'kaspa.js');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const index = content.indexOf('const calcSchnorrSignatureHash');
    if (index !== -1) {
        console.log("Found function at index", index);
        console.log(content.slice(index, index + 3000)); // Print 3000 chars from function start
    } else {
        console.log("Function not found");
    }
} catch (e) {
    console.error("Failed to read file:", e);
}
