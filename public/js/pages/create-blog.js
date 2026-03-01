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
                
                <div id="cover-image-container" style="margin-bottom: 2rem;">
                    ${blog.image_url
            ? `<img id="cover-preview" src="${blog.image_url}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`
            : `<img id="cover-preview" style="display: none; width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`}
                    <input type="file" id="cover-image-file" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-outline" id="cover-btn">
                        ${blog.image_url ? 'Change cover image' : 'Add a cover image'}
                    </button>
                    ${blog.image_url ? `<button type="button" class="btn" id="remove-cover-btn" style="color: var(--error); background: transparent; border: none;">Remove</button>` : ''}
                </div>
                
                <textarea id="content" required 
                    style="width: 100%; border: none; font-size: 1.25rem; font-family: var(--font-serif); outline: none; resize: none; min-height: 500px;" 
                    placeholder="Tell your story...">${blog.content}</textarea>
                
                <div style="position: fixed; top: 1.5rem; right: 2rem; z-index: 1000;">
                    <button type="submit" class="btn btn-accent" id="publish-btn">${isEdit ? 'Update' : 'Publish'}</button>
                </div>
            </form>
        </div>
    `;

    // Handle button clicks since they are dynamic
    document.getElementById('cover-btn').addEventListener('click', () => {
        document.getElementById('cover-image-file').click();
    });

    const removeBtn = document.getElementById('remove-cover-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            blog.image_url = null;
            const preview = document.getElementById('cover-preview');
            preview.src = '';
            preview.style.display = 'none';
            document.getElementById('cover-image-file').value = '';
            removeBtn.style.display = 'none';
            document.getElementById('cover-btn').innerText = 'Add a cover image';
        });
    }

    // Handle cover image preview
    document.getElementById('cover-image-file').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('cover-preview');
                preview.src = e.target.result;
                preview.style.display = 'block';
                document.getElementById('cover-btn').innerText = 'Change cover image';
            }
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const publishBtn = document.getElementById('publish-btn');
        const originalText = publishBtn.innerText;
        publishBtn.innerText = 'Saving...';
        publishBtn.disabled = true;

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const coverFile = document.getElementById('cover-image-file').files[0];

        try {
            let image_url = blog.image_url;

            if (coverFile) {
                const uploadRes = await uploadBlogImage(coverFile);
                image_url = uploadRes.url;
            }

            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/blogs/${params.id}` : '/blogs';

            await apiRequest(endpoint, {
                method,
                body: JSON.stringify({ title, content, image_url })
            });

            showToast(isEdit ? 'Blog updated!' : 'Blog published!', 'success');
            router.navigate('/dashboard');
        } catch (err) {
            showToast(err.message);
        } finally {
            publishBtn.innerText = originalText;
            publishBtn.disabled = false;
        }
    });
}
