async function dashboardPage() {
    try {
        const [blogs, stats] = await Promise.all([
            apiRequest('/blogs/user/me'),
            getDashboardStats()
        ]);

        let blogsHtml = blogs.map(blog => `
            <div class="blog-item" style="display: flex; justify-content: space-between; align-items: center; gap: 2rem;">
                <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                    ${blog.image_url ? `
                        <div style="width: 80px; height: 60px; flex-shrink: 0;">
                            <img src="${blog.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                        </div>
                    ` : `
                        <div style="width: 80px; height: 60px; background: var(--border); border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted);">No image</div>
                    `}
                    <div class="blog-item-content">
                        <h2 class="serif" style="font-size: 1.25rem;">${blog.title}</h2>
                        <div class="blog-date">Last updated: ${new Date(blog.updated_at || blog.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <a href="/edit-blog/${blog.id}" class="btn btn-outline" data-link>Edit</a>
                    <button class="btn" style="background: transparent; color: var(--error); border: 1px solid transparent;" onclick="deleteBlog('${blog.id}')">Delete</button>
                </div>
            </div>
        `).join('');

        const user = auth.user || {};
        const firstLetter = (user.name || user.email || '?').charAt(0).toUpperCase();
        const headerFallback = `<div style="width: 64px; height: 64px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: bold; font-size: 1.5rem;">${firstLetter}</div>`;
        const avatarHtml = user.avatar_url
            ? `<img src="${user.avatar_url}" alt="${user.name}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onerror="this.onerror=null; this.outerHTML='${headerFallback.replace(/'/g, "\\'").replace(/"/g, '&quot;')}';">`
            : headerFallback;

        app.innerHTML = `
            <div style="max-width: 800px; margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        ${avatarHtml}
                        <div>
                            <h1 style="font-size: 2rem; margin-bottom: 0.1rem;">Hey, ${user.name ? user.name.split(' ')[0] : 'there'}!</h1>
                            <div style="color: var(--accent); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">@${user.username || 'user'}</div>
                            <div style="color: var(--text-muted); font-size: 0.95rem; display: flex; gap: 1rem;">
                                <span style="cursor: pointer;" onclick="openFollowersModal()"><strong id="followers-count">${stats.followers}</strong> Followers</span>
                                <span style="cursor: pointer;" onclick="openFollowingModal()"><strong id="following-count">${stats.following}</strong> Following</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-outline" onclick="openEditProfileModal()">Edit Profile</button>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                    <h2 style="font-size: 1.5rem;">Your stories</h2>
                    <a href="/create-blog" class="btn btn-accent" data-link>Write a story</a>
                </div>
                <div class="blog-feed">
                    ${blogsHtml || '<p style="color: var(--text-muted);">You haven\'t written any stories yet.</p>'}
                </div>
            </div>

            <!-- Modals -->
            <div id="editProfileModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <span>Edit Profile</span>
                        <button class="modal-close" onclick="closeModal('editProfileModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-profile-form">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" id="edit-name" value="${user.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Username</label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);">@</span>
                                    <input type="text" id="edit-username" value="${user.username || ''}" required style="padding-left: 2.2rem;">
                                </div>
                                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">3-20 characters, letters, numbers, and underscores.</p>
                            </div>
                            <div class="form-group">
                                <label>Profile Picture</label>
                                <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem;">
                                    <div id="avatar-preview-container">
                                        ${avatarHtml.replace('64px', '80px').replace('64px', '80px')}
                                    </div>
                                    <div style="flex: 1;">
                                        <input type="file" id="edit-avatar-file" accept="image/*" style="display: none;">
                                        <button type="button" class="btn btn-outline" onclick="document.getElementById('edit-avatar-file').click()" style="width: 100%;">Choose Image</button>
                                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">JPG, PNG or GIF. Max 5MB.</p>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>

            <div id="listModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <span id="listModalTitle">Followers</span>
                        <button class="modal-close" onclick="closeModal('listModal')">&times;</button>
                    </div>
                    <div class="modal-body" id="listModalBody" style="padding: 0 1.5rem 1.5rem;">
                        <!-- List items go here -->
                        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading...</div>
                    </div>
                </div>
            </div>
        `;

        // Handle avatar file preview
        document.getElementById('edit-avatar-file').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('avatar-preview-container').innerHTML = `
                        <img src="${e.target.result}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border);">
                    `;
                }
                reader.readAsDataURL(file);
            }
        });

        // Attach Profile Edit handler
        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Saving...';
            submitBtn.disabled = true;

            const name = document.getElementById('edit-name').value;
            const username = document.getElementById('edit-username').value;
            const avatarFile = document.getElementById('edit-avatar-file').files[0];

            try {
                let avatar_url = user.avatar_url;

                if (avatarFile) {
                    const uploadRes = await uploadAvatar(avatarFile);
                    avatar_url = uploadRes.url;
                }

                const data = await updateUserProfile(name, avatar_url, username);
                auth.setUser(data.profile); // Updates localStorage and Sidebar
                showToast('Profile updated!', 'success');
                closeModal('editProfileModal');
                router.resolve(); // Re-render dashboard
            } catch (err) {
                showToast(err.message);
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
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

// Global Modal Handlers
window.openEditProfileModal = () => document.getElementById('editProfileModal').classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

window.openFollowersModal = async () => {
    document.getElementById('listModalTitle').innerText = 'Followers';
    document.getElementById('listModal').classList.add('active');
    document.getElementById('listModalBody').innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading...</div>';
    try {
        const users = await getFollowersList(auth.user.id);
        renderUserList(users);
    } catch (err) {
        document.getElementById('listModalBody').innerHTML = '<p class="alert alert-error">Failed to load followers.</p>';
    }
};

window.openFollowingModal = async () => {
    document.getElementById('listModalTitle').innerText = 'Following';
    document.getElementById('listModal').classList.add('active');
    document.getElementById('listModalBody').innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading...</div>';
    try {
        const users = await getFollowingList(auth.user.id);
        renderUserList(users);
    } catch (err) {
        document.getElementById('listModalBody').innerHTML = '<p class="alert alert-error">Failed to load following.</p>';
    }
};

function renderUserList(users) {
    if (users.length === 0) {
        document.getElementById('listModalBody').innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No users found.</div>';
        return;
    }

    let html = '';
    for (const u of users) {
        const initial = (u.name || 'U').charAt(0).toUpperCase();
        const listFallback = `<div class="user-list-avatar" style="background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`;
        const avatar = u.avatar_url
            ? `<img src="${u.avatar_url}" class="user-list-avatar" onerror="this.onerror=null; this.outerHTML='${listFallback.replace(/'/g, "\\'").replace(/"/g, '&quot;')}';">`
            : listFallback;

        let buttonHtml = '';
        if (auth.user && auth.user.id !== u.id) {
            const btnClass = u.is_following ? 'btn btn-outline' : 'btn btn-primary';
            const btnText = u.is_following ? 'Unfollow' : 'Follow';
            buttonHtml = `<button class="${btnClass}" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="handleListFollow('${u.id}', this)">${btnText}</button>`;
        }

        html += `
            <div class="user-list-item">
                <a href="/u/${u.username}" data-link class="user-list-info" style="text-decoration: none; color: inherit;" onclick="closeModal('listModal')">
                    ${avatar}
                    <div class="user-list-name">${u.name}</div>
                </a>
                ${buttonHtml}
            </div>
        `;
    }

    document.getElementById('listModalBody').innerHTML = html;
}

window.handleListFollow = async (userId, btnEl) => {
    // Optimistic UI toggle for feel
    const isFollowingNow = btnEl.innerText === 'Follow';
    btnEl.innerText = '...';
    try {
        const res = await toggleFollow(userId);
        btnEl.innerText = res.isFollowing ? 'Unfollow' : 'Follow';
        btnEl.className = res.isFollowing ? 'btn btn-outline' : 'btn btn-primary';

        // Optimistically update the dashboard "Following" count
        const followingEl = document.getElementById('following-count');
        if (followingEl) {
            let currentCount = parseInt(followingEl.innerText) || 0;
            currentCount = res.isFollowing ? currentCount + 1 : Math.max(0, currentCount - 1);
            followingEl.innerText = currentCount;
        }
    } catch (err) {
        showToast(err.message);
        btnEl.innerText = isFollowingNow ? 'Follow' : 'Unfollow';
    }
};
