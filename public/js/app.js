const app = document.getElementById('app');
const loader = document.getElementById('loader');

const routes = {
    '/': homePage,
    '/login': loginPage,
    '/register': registerPage,
    '/dashboard': dashboardPage,
    '/notifications': renderNotifications,
    '/blog/:id': blogDetailPage,
    '/u/:username': userProfilePage,
    '/create-blog': createBlogPage,
    '/edit-blog/:id': createBlogPage // Reusing create page for edit
};

const router = {
    async navigate(path) {
        window.history.pushState({}, '', path);
        await this.resolve();
    },

    async resolve() {
        let path = window.location.pathname;
        let route = routes[path];
        let params = {};

        // Simple param matching for /blog/:id
        if (!route) {
            for (const key in routes) {
                if (key.includes(':')) {
                    const regex = new RegExp(`^${key.replace(/:[^\s/]+/g, '([^\\s/]+)')}$`);
                    const match = path.match(regex);
                    if (match) {
                        route = routes[key];
                        const paramNames = (key.match(/:[^\s/]+/g) || []).map(n => n.slice(1));
                        paramNames.forEach((name, i) => params[name] = match[i + 1]);
                        break;
                    }
                }
            }
        }

        if (!route) {
            app.innerHTML = '<h1>404 Not Found</h1>';
            return;
        }

        // Protected routes check
        const protectedRoutes = ['/dashboard', '/create-blog', '/edit-blog', '/notifications'];
        if (protectedRoutes.some(pr => path.startsWith(pr)) && !auth.isAuthenticated()) {
            this.navigate('/login');
            return;
        }

        loader.style.display = 'block';
        app.innerHTML = '';
        try {
            await route(params);
        } catch (err) {
            console.error('Routing error:', err);
            app.innerHTML = '<p class="alert alert-error">Error loading page.</p>';
        }
        loader.style.display = 'none';
    }
};

function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `alert alert-${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Global click listener for data-link
document.addEventListener('click', e => {
    const link = e.target.closest('[data-link]');
    if (link) {
        e.preventDefault();
        router.navigate(link.getAttribute('href'));
    }
});

window.addEventListener('popstate', () => router.resolve());
window.router = router;
window.showToast = showToast;

// Initialize
auth.init().then(() => {
    router.resolve();

    // Setup Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', e => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                if (query) {
                    router.navigate(`/?search=${encodeURIComponent(query)}`);
                } else {
                    router.navigate('/');
                }
            }, 500);
        });

        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    router.navigate(`/?search=${encodeURIComponent(query)}`);
                } else {
                    router.navigate('/');
                }
            }
        });
    }
});
