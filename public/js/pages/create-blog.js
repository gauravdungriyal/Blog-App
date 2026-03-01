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
                
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Category</label>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <select id="category" required style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color); font-size: 1rem;">
                            <option value="">Select a category</option>
                            <option value="Technology" ${blog.category === 'Technology' ? 'selected' : ''}>Technology</option>
                            <option value="Lifestyle" ${blog.category === 'Lifestyle' ? 'selected' : ''}>Lifestyle</option>
                            <option value="Health & Fitness" ${blog.category === 'Health & Fitness' ? 'selected' : ''}>Health & Fitness</option>
                            <option value="Travel" ${blog.category === 'Travel' ? 'selected' : ''}>Travel</option>
                            <option value="Food & Recipes" ${blog.category === 'Food & Recipes' ? 'selected' : ''}>Food & Recipes</option>
                            <option value="Education" ${blog.category === 'Education' ? 'selected' : ''}>Education</option>
                            <option value="Finance & Business" ${blog.category === 'Finance & Business' ? 'selected' : ''}>Finance & Business</option>
                            <option value="Entertainment & Sports" ${blog.category === 'Entertainment & Sports' ? 'selected' : ''}>Entertainment & Sports</option>
                        </select>
                        <button type="button" id="suggest-cat-btn" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                            ✨ Suggest with AI
                        </button>
                    </div>
                    <p id="suggestion-tip" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); display: none;"></p>
                </div>

                <div style="margin-top: 2rem;">
                    <input type="text" id="hashtags" placeholder="Hashtags (e.g. #tech #news)" 
                        style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-card); color: var(--text-color);">
                </div>

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

    // Handle AI suggestion button
    document.getElementById('suggest-cat-btn').addEventListener('click', async () => {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const hashtags = document.getElementById('hashtags').value;
        const suggestBtn = document.getElementById('suggest-cat-btn');
        const tip = document.getElementById('suggestion-tip');

        if (!title || !content) {
            showToast('Please enter title and content first');
            return;
        }

        suggestBtn.disabled = true;
        suggestBtn.innerText = '✨ Analyzing...';
        tip.style.display = 'none';

        try {
            const res = await detectCategory(title, content, hashtags);
            if (res && res.category) {
                document.getElementById('category').value = res.category;
                tip.innerText = `AI Suggestion: ${res.category}`;
                tip.style.display = 'block';
                showToast(`Suggested: ${res.category}`, 'success');
            } else {
                showToast('AI could not determine a category', 'info');
            }
        } catch (err) {
            showToast('AI suggestion failed');
            console.error(err);
        } finally {
            suggestBtn.disabled = false;
            suggestBtn.innerText = '✨ Suggest with AI';
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
        const hashtags = document.getElementById('hashtags').value;
        let category = document.getElementById('category').value;

        try {
            // Auto-detect if no category selected
            if (!category) {
                publishBtn.innerText = 'Analyzing content...';
                try {
                    const suggestion = await detectCategory(title, content, hashtags);
                    if (suggestion && suggestion.category) {
                        category = suggestion.category;
                        document.getElementById('category').value = category;
                        showToast(`AI suggested: ${category}`, 'info');
                    }
                } catch (catErr) {
                    console.error('Auto-detection failed:', catErr);
                }
            }

            if (!category) {
                showToast('Please select a category before publishing.');
                publishBtn.innerText = originalText;
                publishBtn.disabled = false;
                return;
            }

            publishBtn.innerText = 'Saving...';

            let image_url = blog.image_url;

            if (coverFile) {
                const uploadRes = await uploadBlogImage(coverFile);
                image_url = uploadRes.url;
            }

            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/blogs/${params.id}` : '/blogs';

            await apiRequest(endpoint, {
                method,
                body: JSON.stringify({ title, content, image_url, category })
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
