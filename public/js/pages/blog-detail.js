async function blogDetailPage(params) {
    try {
        const blog = await apiRequest(`/blogs/${params.id}`);

        app.innerHTML = `
            <article style="max-width: 680px; margin: 4rem auto; padding: 0 1rem;">
                <header style="margin-bottom: 3rem;">
                    <h1 class="serif" style="font-size: 3rem; margin-bottom: 2rem;">${blog.title}</h1>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #f2f2f2; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                            ${(blog.profiles?.name || 'A')[0]}
                        </div>
                        <div>
                            <div class="author-name" style="font-size: 1rem;">${blog.profiles?.name || 'Anonymous'}</div>
                            <div class="blog-date" style="font-size: 0.9rem;">
                                ${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${Math.ceil(blog.content.length / 1000)} min read
                            </div>
                        </div>
                    </div>
                </header>
                <div class="serif" style="font-size: 1.25rem; line-height: 1.8; color: var(--text-main); white-space: pre-wrap;">${blog.content}</div>
                <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                    <a href="/" data-link class="btn btn-outline">← Back to Feed</a>
                </footer>
            </article>
        `;
    } catch (err) {
        showToast(err.message);
        router.navigate('/');
    }
}
