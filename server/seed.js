const { supabaseAdmin } = require('./config/supabase');
require('dotenv').config();

const seedUser = async () => {
    if (!supabaseAdmin) {
        console.error('Supabase Service Role Key missing! Cannot seed user.');
        return;
    }

    const email = 'dungriyalgaurav08@gmail.com';
    const password = 'kg867gjnki';
    const name = 'Gaurav Dungriyal';

    try {
        console.log(`Checking if user ${email} exists...`);

        // List users to check if exists (using admin client)
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            console.log('Default user already exists. Skipping seed.');
            return;
        }

        console.log('Creating default user...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) throw authError;

        console.log('Creating profile for default user...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{ id: authData.user.id, name }]);

        if (profileError) throw profileError;

        console.log('Seed successful! Default user created.');
    } catch (err) {
        const isTimeout = err.message?.includes('fetch failed') || err.code === 'UND_ERR_CONNECT_TIMEOUT';
        if (isTimeout) {
            console.error('\x1b[31m%s\x1b[0m', 'CRITICAL NETWORK ERROR: Connection to Supabase timed out.');
            console.error('\x1b[33m%s\x1b[0m', 'TIP: This is often caused by regional ISP blocks (common in India).');
            console.log('\x1b[36m%s\x1b[0m', 'Try: 1. Using a VPN | 2. Changing DNS to 8.8.8.8 | 3. Checking your internet connection');
        } else {
            console.error('Seed Error:', err);
        }
    }
};

module.exports = seedUser;
