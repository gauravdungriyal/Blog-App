async function loginPage() {
    app.innerHTML = `
        <div style="max-width: 400px; margin: 8rem auto; padding: 0 1rem; text-align: center;">
            <h1 class="serif" style="font-size: 2rem; margin-bottom: 2rem;">Welcome back.</h1>
            <form id="login-form">
                <div style="margin-bottom: 1rem;">
                    <input type="email" id="email" required placeholder="Email" 
                        style="width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid var(--border); outline: none;">
                </div>
                <div style="margin-bottom: 2rem;">
                    <input type="password" id="password" required placeholder="Password" 
                        style="width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid var(--border); outline: none;">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; background: #000;">Sign in</button>
            </form>
            <p style="margin-top: 2rem; font-size: 0.9rem; color: var(--text-muted);">No account? <a href="/register" data-link style="color: var(--accent); font-weight: 700; text-decoration: none;">Create one</a></p>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            auth.setUser(data.user);
            showToast('Login successful!', 'success');
            router.navigate('/dashboard');
        } catch (err) {
            showToast(err.message);
        }
    });
}
