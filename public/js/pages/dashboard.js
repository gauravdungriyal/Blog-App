async function dashboardPage() {
    try {
        const blogs = await apiRequest('/blogs/user/me');

        let blogsHtml = blogs.map(blog => `
            <div class="blog-item" style="align-items: center;">
                <div class="blog-item-content">
                    <h2 class="serif">${blog.title}</h2>
                    <div class="blog-date">Last updated: ${new Date(blog.updated_at || blog.created_at).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <a href="/edit-blog/${blog.id}" class="btn btn-outline" data-link>Edit</a>
                    <button class="btn" style="background: transparent; color: var(--error); border: 1px solid transparent;" onclick="deleteBlog('${blog.id}')">Delete</button>
                </div>
            </div>
        `).join('');

        app.innerHTML = `
            <div style="max-width: 800px; margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
                    <h1 style="font-size: 2.5rem;">Your stories</h1>
                    <a href="/create-blog" class="btn btn-accent" data-link>Write a story</a>
                </div>
                <div class="blog-feed">
                    ${blogsHtml || '<p style="color: var(--text-muted);">You haven\'t written any stories yet.</p>'}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message);
    }
}

async function deleteBlog(id) {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
        await apiRequest(`/blogs/${id}`, { method: 'DELETE' });
        showToast('Blog deleted successfully', 'success');
        router.resolve(); // Refresh current page
    } catch (err) {
        showToast(err.message);
    }
}

window.deleteBlog = deleteBlog;
