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

        let usersHtml = '';
        const filteredUsers = users.filter(u => u.id != auth.user?.id);
        if (filteredUsers && filteredUsers.length > 0) {
            usersHtml = `
                <div style="margin-bottom: 2rem; background: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Users</h3>
                    <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none;">
                        ${filteredUsers.map(u => {
                const initial = (u.name || 'U').charAt(0).toUpperCase();
                const isFollowing = u.is_following;
                const btnClass = isFollowing ? 'btn btn-outline' : 'btn btn-primary';
                const btnText = isFollowing ? 'Following' : 'Follow';
                const isSelf = auth.isAuthenticated() && auth.user?.id == u.id;

                return `
                                <div style="min-width: 140px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                    <a href="/u/${u.username}" data-link style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center;">
                                        ${u.avatar_url
                        ? `<img src="${u.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-bottom: 0.25rem;">`
                        : `<div style="width: 50px; height: 50px; border-radius: 50%; background: var(--border); margin: 0 auto 0.25rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`
                    }
                                        <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${u.name}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>
                                    </a>
                                    ${!isSelf ? `
                                        <button class="btn ${btnClass} search-follow-btn" 
                                                data-user-id="${u.id}" 
                                                style="padding: 0.3rem 1rem; font-size: 0.8rem; width: 90px;">
                                            ${btnText}
                                        </button>
                                    ` : '<div style="height: 28px;"></div>'}
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        app.innerHTML = `
            <div class="content-grid-single">
                <div class="blog-feed">
                    <div style="margin-bottom: 2.5rem;">
                        <h1 class="serif" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 2rem;">Latest Stories</h1>
                    </div>
                    ${usersHtml}
                    <div class="blogs-container">
                        ${blogs.map(blog => {
            const date = new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return `
                                <div class="blog-item" onclick="router.navigate('/blog/${blog.id}')" style="display: flex; justify-content: space-between; gap: 2rem; padding: 2rem 0; border-bottom: 1px solid var(--border); cursor: pointer;">
                                    <div class="blog-item-content" style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                                            <span style="font-weight: 600; color: var(--text-main);">${blog.profiles?.name || 'Anonymous'}</span>
                                            ${blog.category ? `<span>in</span><span style="color: var(--accent); font-weight: 500;">${blog.category}</span>` : ''}
                                        </div>
                                        <h2 class="serif" style="font-size: 1.6rem; margin-bottom: 0.75rem; color: var(--text-main); line-height: 1.25;">${blog.title}</h2>
                                        <p class="excerpt" style="font-size: 1.05rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${blog.content}</p>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">${date}</div>
                                    </div>
                                    <div class="blog-item-image">
                                        ${blog.image_url
                    ? `<img src="${blog.image_url}" alt="${blog.title}">`
                    : `<div class="blog-placeholder">${(blog.category || blog.title || 'B')[0].toUpperCase()}</div>`
                }
                                    </div>
                                </div>
                            `;
        }).join('') || (search || activeCategory ? `<p>No stories found.</p>` : '<p>No stories yet. Start writing today!</p>')}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for follow buttons
        document.querySelectorAll('.search-follow-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!auth.isAuthenticated()) {
                    showToast('Please login to follow', 'error');
                    return;
                }

                const userId = btn.getAttribute('data-user-id');
                const originalText = btn.innerText;
                btn.innerText = '...';
                btn.disabled = true;

                try {
                    const res = await toggleFollow(userId);
                    btn.innerText = res.isFollowing ? 'Following' : 'Follow';
                    btn.className = `btn ${res.isFollowing ? 'btn-outline' : 'btn-primary'} search-follow-btn`;
                } catch (err) {
                    showToast(err.message);
                    btn.innerText = originalText;
                } finally {
                    btn.disabled = false;
                }
            });
        });
    } catch (err) {
        showToast(err.message);
    }
}
