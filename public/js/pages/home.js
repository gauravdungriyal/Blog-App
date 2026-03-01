async function homePage(params) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search');
        const activeCategory = urlParams.get('category');

        let endpoint = '/blogs';
        const queryParams = [];
        if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
        if (activeCategory) queryParams.push(`category=${encodeURIComponent(activeCategory)}`);

        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        // Keep search input in sync
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = search || '';

        // Fetch blogs and users (parallel)
        const [blogs, users] = await Promise.all([
            apiRequest(endpoint),
            search ? searchUsers(search) : Promise.resolve([])
        ]);

        const categories = [
            'All', 'Technology', 'Lifestyle', 'Health & Fitness', 'Travel', 'Food & Recipes',
            'Education', 'Finance & Business', 'Entertainment & Sports', 'News'
        ];

        const categoryNavHtml = `
            <div class="category-nav">
                ${categories.map(cat => {
            const isForYou = cat === 'All';
            const catValue = isForYou ? '' : cat;
            const isActive = activeCategory === catValue || (isForYou && !activeCategory);
            const url = isForYou ? '/' : `/?category=${encodeURIComponent(cat)}`;
            return `<a href="${url}" data-link class="category-item ${isActive ? 'active' : ''}">${cat}</a>`;
        }).join('')}
            </div>
        `;

        const blogsHtml = blogs.map(blog => `
            <div class="blog-item">
                <div class="blog-item-content">
                    <div class="blog-item-meta">
                        <a href="/u/${blog.profiles?.username || blog.author_id}" data-link class="author-name" style="text-decoration: none; color: inherit; font-weight: 700;">${blog.profiles?.name || 'Anonymous'}</a>
                        <span class="blog-date">· ${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    ${blog.category ? `<span class="blog-category-tag">${blog.category}</span>` : ''}
                    <h2 class="serif" onclick="router.navigate('/blog/${blog.id}')" style="cursor: pointer;">${blog.title}</h2>
                    <p class="excerpt" onclick="router.navigate('/blog/${blog.id}')" style="cursor: pointer;">${blog.content}</p>
                    <div class="blog-item-footer">
                        <span>${Math.ceil(blog.content.length / 1000)} min read · <span class="tag">Selected for you</span></span>
                    </div>
                </div>
            </div>
        `).join('');

        let usersHtml = '';
        if (users && users.length > 0) {
            usersHtml = `
                <div style="margin-bottom: 2rem; background: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Users</h3>
                    <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none;">
                        ${users.map(u => {
                const initial = (u.name || 'U').charAt(0).toUpperCase();
                return `
                                <a href="/u/${u.username}" data-link style="text-decoration: none; min-width: 120px; text-align: center; color: inherit;">
                                    ${u.avatar_url
                        ? `<img src="${u.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-bottom: 0.5rem;">`
                        : `<div style="width: 50px; height: 50px; border-radius: 50%; background: var(--border); margin: 0 auto 0.5rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`
                    }
                                    <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>
                                </a>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        app.innerHTML = `
            <div class="content-grid-single">
                <div class="blog-feed">
                    ${categoryNavHtml}
                    <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <h3 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">
                            ${search ? `Results for "${search}"` : (activeCategory ? activeCategory : 'For you')}
                        </h3>
                    </div>
                    ${usersHtml}
                    ${blogsHtml || (search || activeCategory ? `<p>No stories found.</p>` : '<p>No stories yet. Start writing today!</p>')}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message);
    }
}
