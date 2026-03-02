async function blogDetailPage(params) {
    try {
        const blog = await apiRequest(`/blogs/${params.id}`);
        const currentUser = auth.user;

        app.innerHTML = `
            <article style="max-width: 680px; margin: 2rem auto 4rem; padding: 0 1rem;">
                <nav style="margin-bottom: 2rem;">
                    <a href="/" data-link style="display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to feed
                    </a>
                </nav>
                <header style="margin-bottom: 3rem;">
                    <h1 class="serif" style="font-size: 3rem; margin-bottom: 2rem;">${blog.title}</h1>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #f2f2f2; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                            ${(blog.profiles?.name || 'A')[0]}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="author-name" style="font-size: 1rem;">${blog.profiles?.name || 'Anonymous'}</div>
                                ${!currentUser || currentUser.id != blog.author_id ? `
                                    <button id="follow-btn" class="btn btn-outline" style="padding: 0.2rem 0.6rem; font-size: 0.8rem; border-color: var(--accent); color: var(--accent); border-radius: 4px;">Follow</button>
                                ` : ''}
                            </div>
                            <div class="blog-date" style="font-size: 0.9rem; margin-top: 0.2rem;">
                                ${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${Math.ceil(blog.content.length / 1000)} min read
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
                        <button id="like-btn" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; border-color: var(--border); color: var(--text-muted); transition: all 0.2s;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <defs>
                                    <linearGradient id="pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#ff2a5f" />
                                        <stop offset="100%" stop-color="#ff7b9c" />
                                    </linearGradient>
                                </defs>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span id="like-count">0</span>
                        </button>
                    </div>
                </header>
                
                ${blog.image_url ? `
                    <div class="blog-detail-image" style="margin-bottom: 3rem;">
                        <img src="${blog.image_url}" alt="${blog.title}" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    </div>
                ` : ''}

                <div class="serif" style="font-size: 1.25rem; line-height: 1.8; color: var(--text-main); white-space: pre-wrap;">${blog.content}</div>

                <hr style="border: 0; border-top: 1px solid var(--border); margin: 4rem 0 2rem;" />
                
                <section id="comments-section">
                    <h3 style="margin-bottom: 1.5rem;">Comments</h3>
                    ${currentUser ? `
                    <form id="comment-form" style="margin-bottom: 2rem;">
                        <textarea id="comment-input" rows="3" placeholder="What are your thoughts?" style="width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; font-family: var(--font-sans);"></textarea>
                        <div style="display: flex; justify-content: flex-end;">
                            <button type="submit" class="btn btn-primary">Respond</button>
                        </div>
                    </form>
                    ` : '<p style="margin-bottom: 2rem; color: var(--text-muted);"><a href="/login" data-link style="color: var(--primary); text-decoration: underline;">Log in</a> to leave a comment.</p>'}
                    
                    <div id="comments-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <!-- Comments will be injected here -->
                    </div>
                </section>

                <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                    <a href="/" data-link class="btn btn-outline">← Back to Feed</a>
                </footer>
            </article>
        `;

        // Initialize Interactions
        initInteractions(blog.id, currentUser, blog);

    } catch (err) {
        showToast(err.message);
        router.navigate('/');
    }
}

async function initInteractions(blogId, currentUser, blog) {
    const likeBtn = document.getElementById('like-btn');
    const likeCountSpan = document.getElementById('like-count');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');

    // 1. Fetch and render initial status
    try {
        const [likesData, commentsData, followData] = await Promise.all([
            getLikes(blogId, currentUser?.id),
            getComments(blogId),
            getFollowStatus(blog.author_id)
        ]);

        // Render Likes
        likeCountSpan.textContent = likesData.count;
        if (likesData.userLiked) {
            likeBtn.classList.add('liked');
            likeBtn.style.color = '#ff2a5f';
            likeBtn.style.borderColor = '#ff2a5f';
            likeBtn.querySelector('svg').style.fill = 'url(#pink-gradient)';
            likeBtn.querySelector('svg').style.stroke = '#ff2a5f';
        }

        // Render Comments
        renderComments(commentsData, commentsList, currentUser, blogId);

        // Render Follow Status
        const followBtn = document.getElementById('follow-btn');
        if (followBtn && followData.isFollowing) {
            followBtn.textContent = 'Following';
            followBtn.style.background = 'var(--accent)';
            followBtn.style.color = '#fff';
        }
    } catch (err) {
        console.error("Error loading interactions:", err);
    }

    // 2. Setup Like click handler
    likeBtn.addEventListener('click', async () => {
        if (!currentUser) {
            showToast('Please log in to like a post.');
            return;
        }

        const isCurrentlyLiked = likeBtn.classList.contains('liked');
        const currentCount = parseInt(likeCountSpan.textContent);

        // Optimistic UI update
        if (isCurrentlyLiked) {
            likeBtn.classList.remove('liked');
            likeBtn.style.color = 'var(--text-muted)';
            likeBtn.style.borderColor = 'var(--border)';
            likeBtn.querySelector('svg').style.fill = 'none';
            likeBtn.querySelector('svg').style.stroke = 'currentColor';
            likeCountSpan.textContent = currentCount - 1;
        } else {
            likeBtn.classList.add('liked');
            likeBtn.style.color = '#ff2a5f';
            likeBtn.style.borderColor = '#ff2a5f';
            likeBtn.querySelector('svg').style.fill = 'url(#pink-gradient)';
            likeBtn.querySelector('svg').style.stroke = '#ff2a5f';
            likeCountSpan.textContent = currentCount + 1;
        }

        try {
            await toggleLike(blogId);
        } catch (err) {
            // Revert on error
            showToast('Failed to update like status');
            if (isCurrentlyLiked) {
                likeBtn.classList.add('liked');
                likeBtn.style.color = '#ff2a5f';
                likeCountSpan.textContent = currentCount;
            } else {
                likeBtn.classList.remove('liked');
                likeBtn.style.color = 'var(--text-muted)';
                likeCountSpan.textContent = currentCount;
            }
        }
    });

    // Setup Follow click handler
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', async () => {
            if (!auth.isAuthenticated()) {
                showToast('Please login to follow', 'error');
                return;
            }

            const isFollowing = followBtn.textContent === 'Following';

            // Optimistic Update
            if (isFollowing) {
                followBtn.textContent = 'Follow';
                followBtn.style.background = 'transparent';
                followBtn.style.color = 'var(--accent)';
            } else {
                followBtn.textContent = 'Following';
                followBtn.style.background = 'var(--accent)';
                followBtn.style.color = '#fff';
            }

            try {
                await toggleFollow(blog.author_id);
            } catch (err) {
                showToast('Failed to update follow status');
                // Revert
                if (isFollowing) {
                    followBtn.textContent = 'Following';
                    followBtn.style.background = 'var(--accent)';
                    followBtn.style.color = '#fff';
                } else {
                    followBtn.textContent = 'Follow';
                    followBtn.style.background = 'transparent';
                    followBtn.style.color = 'var(--accent)';
                }
            }
        });
    }

    // 3. Setup Comment submit handler
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = commentInput.value.trim();
            if (!content) return;

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            try {
                const newComment = await addComment(blogId, content);
                commentInput.value = '';

                // Add new comment to UI
                const commentHTML = createCommentHTML(newComment, currentUser, blogId);
                commentsList.insertAdjacentHTML('beforeend', commentHTML); // Or prepend depending on order
            } catch (err) {
                showToast(err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Respond';
            }
        });
    }
}

function renderComments(comments, container, currentUser, blogId) {
    if (comments.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No comments yet. Be the first!</p>';
        return;
    }
    container.innerHTML = comments.map(c => createCommentHTML(c, currentUser, blogId)).join('');
}

function createCommentHTML(comment, currentUser, blogId) {
    const isOwner = currentUser && currentUser.id === comment.user_id;
    return `
        <div class="comment-item" id="comment-${comment.id}" style="padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #f2f2f2; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800;">
                        ${(comment.profiles?.name || 'A')[0]}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${comment.profiles?.name || 'Anonymous'}</div>
                        <div style="color: var(--text-muted); font-size: 0.8rem;">${new Date(comment.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                ${isOwner ? `<button onclick="handleDeleteComment('${blogId}', '${comment.id}')" style="background: none; border: none; color: #ff4d4f; cursor: pointer; font-size: 0.8rem;">Delete</button>` : ''}
            </div>
            <div style="margin-left: 44px; color: var(--text-main); font-size: 0.95rem;">
                ${comment.content}
            </div>
        </div>
    `;
}

window.handleDeleteComment = async function (blogId, commentId) {
    if (!confirm('Delete this comment?')) return;
    try {
        await deleteComment(blogId, commentId);
        document.getElementById(`comment-${commentId}`).remove();
    } catch (err) {
        showToast(err.message);
    }
};
