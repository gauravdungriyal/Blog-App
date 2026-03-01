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
                <li>
                    <a href="/notifications" data-link style="display: flex; align-items: center; justify-content: space-between;">
                        <span><i class="icon">🔔</i> Notifications</span>
                        <span id="nav-notification-badge" style="background: var(--primary); color: white; border-radius: 50%; font-size: 0.75rem; padding: 2px 6px; display: none;">0</span>
                    </a>
                </li>
            `;

            const firstLetter = (this.user.name || this.user.email || 'U').charAt(0).toUpperCase();
            const fallbackHtml = `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: bold;">${firstLetter}</div>`;
            const avatarHtml = this.user.avatar_url
                ? `<img src="${this.user.avatar_url}" alt="${this.user.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" onerror="this.onerror=null; this.outerHTML='${fallbackHtml.replace(/'/g, "\\'").replace(/"/g, '&quot;')}';">`
                : fallbackHtml;

            authHtml = `
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        ${avatarHtml}
                        <div>
                            <p class="author-name" style="margin: 0; text-transform: capitalize; font-weight: 600;">${this.user.name || this.user.email.split('@')[0]}</p>
                            <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">@${this.user.username || 'user'}</p>
                        </div>
                    </div>
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

        if (sidebarNav) sidebarNav.innerHTML = navHtml;
        if (authSection) authSection.innerHTML = authHtml;

        // Fetch unread notifications asynchronously after DOM injection
        if (this.isAuthenticated()) {
            getNotifications().then(notifications => {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                const badge = document.getElementById('nav-notification-badge');
                if (badge) {
                    if (unreadCount > 0) {
                        badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
                        badge.style.display = 'inline-block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }).catch(err => console.error('Failed to load notification badge', err));
        }

        // Mark active link
        const currentPath = window.location.pathname;
        if (sidebarNav) {
            sidebarNav.querySelectorAll('a').forEach(a => {
                if (a.getAttribute('href') === currentPath) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });
        }
    }
};

window.auth = auth;
