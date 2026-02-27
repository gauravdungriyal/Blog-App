async function registerPage() {
    app.innerHTML = `
        <div style="max-width: 400px; margin: 8rem auto; padding: 0 1rem; text-align: center;">
            <h1 class="serif" style="font-size: 2rem; margin-bottom: 2rem;">Join BlogApp.</h1>
            <form id="register-form">
                <div style="margin-bottom: 1rem;">
                    <input type="text" id="name" required placeholder="Full Name" 
                        style="width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid var(--border); outline: none;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <input type="email" id="email" required placeholder="Email" 
                        style="width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid var(--border); outline: none;">
                </div>
                <div style="margin-bottom: 2rem;">
                    <input type="password" id="password" required placeholder="Password" 
                        style="width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid var(--border); outline: none;">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; background: #000;">Sign up</button>
            </form>
            <p style="margin-top: 2rem; font-size: 0.9rem; color: var(--text-muted);">Already have an account? <a href="/login" data-link style="color: var(--accent); font-weight: 700; text-decoration: none;">Sign in</a></p>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            showToast('Registration successful! Please login.', 'success');
            router.navigate('/login');
        } catch (err) {
            showToast(err.message);
        }
    });
}
