const { supabase, supabaseAdmin } = require('../config/supabase');

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) return res.status(400).json({ error: error.message });
        if (!data.user) return res.status(400).json({ error: 'Signup failed: No user data returned' });

        // Create profile in profiles table using Admin client to bypass RLS
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{ id: data.user.id, name }]);

        if (profileError) {
            console.error('Profile Creation Error:', profileError);
            return res.status(400).json({ error: 'User created but profile setup failed: ' + profileError.message });
        }

        res.status(201).json({ message: 'User registered successfully', user: data.user });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) return res.status(401).json({ error: error.message });

        // Set token in cookie (optional, but good for vanilla JS)
        res.cookie('token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });

        res.status(200).json({
            message: 'Login successful',
            user: data.user,
            session: data.session
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) return res.status(400).json({ error: error.message });

        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
