
import fs from 'fs';
import path from 'path';

const src = path.join(process.cwd(), 'node_modules', 'kaspalib', 'lib', 'address.js');
const dest = path.join(process.cwd(), 'temp_address.js');

fs.copyFileSync(src, dest);
console.log("Copied to", dest);
