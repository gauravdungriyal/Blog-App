async function userProfilePage(params) {
    const { username } = params;

    try {
        const user = await getUserByUsername(username);
        const blogs = await getBlogsByAuthor(user.id);

        // Check follow status if logged in
        let isFollowing = false;
        if (auth.isAuthenticated() && auth.user.id !== user.id) {
            const status = await getFollowStatus(user.id);
            isFollowing = status.isFollowing;
        }

        const firstLetter = (user.name || '?').charAt(0).toUpperCase();
        const headerFallback = `<div style="width: 80px; height: 80px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: bold; font-size: 2rem;">${firstLetter}</div>`;
        const avatarHtml = user.avatar_url
            ? `<img src="${user.avatar_url}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onerror="this.onerror=null; this.outerHTML='${headerFallback.replace(/'/g, "\\'").replace(/"/g, '&quot;')}';">`
            : headerFallback;

        let followBtn = '';
        const isSelf = auth.isAuthenticated() && auth.user?.id == user.id;

        if (!isSelf) {
            const btnClass = isFollowing ? 'btn btn-outline' : 'btn btn-primary';
            const btnText = isFollowing ? 'Following' : 'Follow';
            followBtn = `<button id="profile-follow-btn" class="${btnClass}" style="padding: 0.6rem 2rem;">${btnText}</button>`;
        }

        let blogsHtml = blogs.map(blog => `
            <div class="blog-item" style="cursor: pointer;" onclick="router.navigate('/blog/${blog.id}')">
                <div class="blog-item-content" style="flex: 1;">
                    <div class="blog-category" style="margin-bottom: 0.5rem; display: inline-block;">${blog.category || 'News'}</div>
                    <h2 class="serif" style="margin-bottom: 0.5rem; font-size: 1.5rem;">${blog.title}</h2>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${blog.content.replace(/<[^>]*>/g, '').substring(0, 160)}...
                    </p>
                    <div class="blog-meta" style="font-size: 0.85rem;">
                        <span>${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>
                ${blog.image_url ? `
                <div style="width: 140px; height: 140px; margin-left: 2rem;">
                    <img src="${blog.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                </div>
                ` : ''}
            </div>
        `).join('');

        app.innerHTML = `
            <div style="max-width: 700px; margin: 4rem auto; padding: 0 1rem;">
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 4rem; padding-bottom: 3rem; border-bottom: 1px solid var(--border);">
                    <div style="margin-bottom: 1.5rem;">
                        ${avatarHtml}
                    </div>
                    <h1 style="font-size: 2.25rem; margin-bottom: 0.25rem;">${user.name}</h1>
                    <p style="color: var(--accent); font-weight: 600; margin-bottom: 1.5rem; font-size: 1.1rem;">@${user.username || 'user'}</p>
                    ${followBtn}
                </div>

                <div style="margin-bottom: 2rem;">
                    <h2 class="serif" style="font-size: 1.5rem; margin-bottom: 2rem;">Latest Stories</h2>
                    <div class="blog-feed">
                        ${blogsHtml || '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No stories published yet.</p>'}
                    </div>
                </div>
            </div>
        `;

        // Handle follow button click
        const fb = document.getElementById('profile-follow-btn');
        if (fb) {
            fb.addEventListener('click', async () => {
                if (!auth.isAuthenticated()) {
                    showToast('Please login to follow', 'error');
                    return;
                }

                const originalText = fb.innerText;
                fb.innerText = '...';
                fb.disabled = true;
                try {
                    const res = await toggleFollow(user.id);
                    fb.innerText = res.isFollowing ? 'Following' : 'Follow';
                    fb.className = res.isFollowing ? 'btn btn-outline' : 'btn btn-primary';
                } catch (err) {
                    showToast(err.message);
                    fb.innerText = originalText;
                } finally {
                    fb.disabled = false;
                }
            });
        }

    } catch (err) {
        console.error('Profile Page Error:', err);
        app.innerHTML = `
            <div style="text-align: center; padding: 8rem 1rem;">
                <h1 class="serif">User not found</h1>
                <p style="color: var(--text-muted); margin-top: 1rem;">The user you're looking for doesn't exist.</p>
                <a href="/" data-link class="btn btn-primary" style="margin-top: 2rem; display: inline-block;">Back to Home</a>
            </div>
        `;
    }
}
