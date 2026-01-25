
import { createClient } from '@supabase/supabase-js';

// Mock credentials - we just want to check the prototype/object structure
const supabase = createClient('https://xyz.supabase.co', 'public-anon-key');
const channel = supabase.channel('test');

console.log('Has httpSend?', 'httpSend' in channel);
// @ts-ignore
if (channel.httpSend) {
    console.log('httpSend type:', typeof channel.httpSend);
}

// Check prototype
console.log('Prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(channel)));
