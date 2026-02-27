async function createBlogPage(params) {
    let blog = { title: '', content: '' };
    const isEdit = !!params.id;

    if (isEdit) {
        try {
            blog = await apiRequest(`/blogs/${params.id}`);
            if (blog.author_id !== auth.user.id) {
                showToast('Unauthorized');
                router.navigate('/dashboard');
                return;
            }
        } catch (err) {
            showToast(err.message);
            router.navigate('/dashboard');
            return;
        }
    }

    app.innerHTML = `
        <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <a href="/dashboard" data-link style="color: var(--text-muted); text-decoration: none;">← Back to dashboard</a>
                <span style="font-size: 0.9rem; color: var(--text-muted);">Draft in ${auth.user.email.split('@')[0]}</span>
            </header>
            <form id="blog-form">
                <input type="text" id="title" required value="${blog.title}" 
                    style="width: 100%; border: none; font-size: 3rem; font-family: var(--font-serif); font-weight: 800; outline: none; margin-bottom: 2rem;" 
                    placeholder="Title">
                
                <textarea id="content" required 
                    style="width: 100%; border: none; font-size: 1.25rem; font-family: var(--font-serif); outline: none; resize: none; min-height: 500px;" 
                    placeholder="Tell your story...">${blog.content}</textarea>
                
                <div style="position: fixed; top: 1.5rem; right: 2rem; z-index: 1000;">
                    <button type="submit" class="btn btn-accent">${isEdit ? 'Update' : 'Publish'}</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;

        try {
            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/blogs/${params.id}` : '/blogs';

            await apiRequest(endpoint, {
                method,
                body: JSON.stringify({ title, content })
            });

            showToast(isEdit ? 'Blog updated!' : 'Blog published!', 'success');
            router.navigate('/dashboard');
        } catch (err) {
            showToast(err.message);
        }
    });
}
