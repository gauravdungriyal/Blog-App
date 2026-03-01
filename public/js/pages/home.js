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

        const blogs = await apiRequest(endpoint);

        const categories = [
            'For you', 'Technology', 'Lifestyle', 'Health & Fitness', 'Travel', 'Food & Recipes',
            'Education', 'Finance & Business', 'Entertainment & Sports'
        ];

        const categoryNavHtml = `
            <div class="category-nav">
                ${categories.map(cat => {
            const isForYou = cat === 'For you';
            const catValue = isForYou ? '' : cat;
            const isActive = activeCategory === catValue || (isForYou && !activeCategory);
            const url = isForYou ? '/' : `/?category=${encodeURIComponent(cat)}`;
            return `<a href="${url}" data-link class="category-item ${isActive ? 'active' : ''}">${cat}</a>`;
        }).join('')}
            </div>
        `;

        const blogsHtml = blogs.map(blog => `
            <div class="blog-item" onclick="router.navigate('/blog/${blog.id}')">
                <div class="blog-item-content">
                    <div class="blog-item-meta">
                        <span class="author-name">${blog.profiles?.name || 'Anonymous'}</span>
                        <span class="blog-date">· ${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    ${blog.category ? `<span class="blog-category-tag">${blog.category}</span>` : ''}
                    <h2 class="serif">${blog.title}</h2>
                    <p class="excerpt">${blog.content}</p>
                    <div class="blog-item-footer">
                        <span>${Math.ceil(blog.content.length / 1000)} min read · <span class="tag">Selected for you</span></span>
                    </div>
                </div>
            </div>
        `).join('');

        app.innerHTML = `
            <div class="content-grid-single">
                <div class="blog-feed">
                    ${categoryNavHtml}
                    <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <h3 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">
                            ${search ? `Results for "${search}"` : (activeCategory ? activeCategory : 'For you')}
                        </h3>
                    </div>
                    ${blogsHtml || (search || activeCategory ? `<p>No stories found.</p>` : '<p>No stories yet. Start writing today!</p>')}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message);
    }
}
