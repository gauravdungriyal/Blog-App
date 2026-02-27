const auth = {
    user: null,

    async init() {
        // In a real app, we might check a session endpoint here
        const storedUser = localStorage.getItem('blog_user');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
        this.updateNav();
    },

    setUser(user) {
        this.user = user;
        if (user) {
            localStorage.setItem('blog_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('blog_user');
        }
        this.updateNav();
    },

    isAuthenticated() {
        return !!this.user;
    },

    async logout() {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            this.setUser(null);
            showToast('Logged out successfully', 'success');
            router.navigate('/');
        }
    },

    updateNav() {
        const sidebarNav = document.getElementById('sidebar-nav');
        const authSection = document.getElementById('auth-section');

        let navHtml = `
            <li><a href="/" data-link><i class="icon">🏠</i> Home</a></li>
        `;
        let authHtml = '';

        if (this.isAuthenticated()) {
            navHtml += `
                <li><a href="/dashboard" data-link><i class="icon">📊</i> Dashboard</a></li>
                <li><a href="/create-blog" data-link><i class="icon">✍️</i> Write</a></li>
            `;
            authHtml = `
                <div style="padding: 1rem;">
                    <p class="author-name" style="margin-bottom: 0.5rem;">${this.user.email.split('@')[0]}</p>
                    <button class="btn btn-outline" style="width: 100%" onclick="auth.logout()">Logout</button>
                </div>
            `;
        } else {
            authHtml = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem;">
                    <a href="/login" class="btn btn-outline" data-link>Login</a>
                    <a href="/register" class="btn btn-primary" data-link>Get Started</a>
                </div>
            `;
        }

        sidebarNav.innerHTML = navHtml;
        authSection.innerHTML = authHtml;

        // Mark active link
        const currentPath = window.location.pathname;
        sidebarNav.querySelectorAll('a').forEach(a => {
            if (a.getAttribute('href') === currentPath) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }
};

window.auth = auth;
