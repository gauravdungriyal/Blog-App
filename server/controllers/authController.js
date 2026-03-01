const { supabase, supabaseAdmin } = require('../config/supabase');


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

// Initiate Google OAuth login
exports.googleLogin = async (req, res) => {
    console.log("HIT /auth/google ENPOINT!");
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`
            }
        });

        if (error) {
            console.error("Supabase OAuth Error:", error);
            return res.status(400).json({ error: error.message });
        }

        console.log("Supabase OAuth Data:", data);
        // Return the URL for the frontend to redirect the user
        res.status(200).json({ url: data.url });
    } catch (err) {
        console.error('Google Login Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Handle Google OAuth callback (Implicit flow returns #access_token)
exports.googleCallback = async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authenticating...</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; margin: 0; }
                .loader { border: 4px solid #f3f3f3; border-top: 4px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div style="text-align: center;">
                <div class="loader" style="margin: 0 auto 1rem;"></div>
                <h2 id="msg">Authenticating...</h2>
            </div>
            <script>
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    const params = new URLSearchParams(hash.substring(1));
                    const accessToken = params.get('access_token');
                    
                    fetch('/api/auth/google/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: accessToken })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to set session');
                        return res.json();
                    })
                    .then(data => {
                        localStorage.setItem('blog_user', JSON.stringify(data.user));
                        window.location.href = '/dashboard';
                    })
                    .catch(e => {
                        console.error(e);
                        document.getElementById('msg').innerText = 'Authentication failed. Please try again.';
                    });
                } else {
                    document.getElementById('msg').innerText = 'Authorization token missing. Please try again.';
                }
            </script>
        </body>
        </html>
    `);
};

// Create a secure cookie session from the frontend's access token mapping
exports.googleSession = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'Access token required' });

        // Retrieve user securely from Supabase using the token
        const { data: { user }, error } = await supabase.auth.getUser(access_token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Set secure HTTP-only cookie for all future API requests
        res.cookie('token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });

        // Ensure user has a profile record
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const email = user.email;
        const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        // Try to insert cleanly; if it exists, it ignores or updates
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: user.id, name, avatar_url }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile Upsert Error during Google Login:', profileError);
        }

        res.status(200).json({ message: 'Session created successfully', user: { ...user, name, avatar_url } });
    } catch (err) {
        console.error('Google Session Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
