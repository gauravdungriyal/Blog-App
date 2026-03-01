const { supabaseUrl } = require('../config/supabase');
const http = require('http');
const https = require('https');

const checkConnectivity = () => {
    return new Promise((resolve) => {
        if (!supabaseUrl) return resolve(false);

        const url = new URL(supabaseUrl);
        const client = url.protocol === 'https:' ? https : http;

        console.log(`\n\x1b[36mDIAGNOSTIC:\x1b[0m Checking connection to ${url.hostname}...`);

        const req = client.get({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: '/',
            timeout: 5000
        }, (res) => {
            console.log(`\x1b[32mSUCCESS:\x1b[0m Supabase domain is reachable (Status: ${res.statusCode}).`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.error(`\x1b[31mNETWORK ALERT:\x1b[0m Cannot reach Supabase (${err.message}).`);
            if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.message.includes('timeout')) {
                console.error('\x1b[33m%s\x1b[0m', 'This usually confirms an ISP-level block or DNS issue.');
            }
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('\x1b[31mNETWORK ALERT:\x1b[0m Connection to Supabase timed out after 5s.');
            console.error('\x1b[33m%s\x1b[0m', 'This confirms a regional block (common with Jio/Airtel in India).');
            resolve(false);
        });
    });
};

module.exports = checkConnectivity;
