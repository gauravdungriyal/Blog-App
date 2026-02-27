async function homePage() {
    try {
        const blogs = await apiRequest('/blogs');

        const blogsHtml = blogs.map(blog => `
            <div class="blog-item" onclick="router.navigate('/blog/${blog.id}')">
                <div class="blog-item-content">
                    <div class="blog-item-meta">
                        <span class="author-name">${blog.profiles?.name || 'Anonymous'}</span>
                        <span class="blog-date">· ${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
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
                    <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <h3 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">For you</h3>
                    </div>
                    ${blogsHtml || '<p>No stories yet. Start writing today!</p>'}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message);
    }
}
