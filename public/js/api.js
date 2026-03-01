const API_URL = window.location.origin; // Dynamically set to the current domain


async function apiRequest(endpoint, options = {}) {
    // Ensure the endpoint hits our isolated backend router
    const finalEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    try {
        const response = await fetch(finalEndpoint, defaultOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error(`API Request Error [${endpoint}]:`, error);
        throw error;
    }
}

// --- Interaction APIs ---

async function getLikes(blogId, userId = null) {
    let url = `/blogs/${blogId}/likes`;
    if (userId) {
        url += `?userId=${userId}`;
    }
    return apiRequest(url);
}

async function toggleLike(blogId) {
    const token = localStorage.getItem('token');
    return apiRequest(`/blogs/${blogId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

async function getComments(blogId) {
    return apiRequest(`/blogs/${blogId}/comments`);
}

async function addComment(blogId, content) {
    const token = localStorage.getItem('token');
    return apiRequest(`/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
}

async function deleteComment(blogId, commentId) {
    const token = localStorage.getItem('token');
    return apiRequest(`/blogs/${blogId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

// --- User APIs ---

async function getFollowStatus(userId) {
    const currentUserId = auth.user?.id;
    let url = `/users/${userId}/follow-status`;
    if (currentUserId) {
        url += `?userId=${currentUserId}`;
    }
    return apiRequest(url);
}

async function toggleFollow(userId) {
    const token = localStorage.getItem('token');
    return apiRequest(`/users/${userId}/follow`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

async function getDashboardStats() {
    const token = localStorage.getItem('token');
    return apiRequest(`/users/me/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

async function updateUserProfile(name, avatar_url) {
    const token = localStorage.getItem('token');
    return apiRequest(`/users/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatar_url })
    });
}

async function uploadAvatar(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    return apiRequest(`/users/upload-avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type is set automatically for FormData
        },
        body: formData
    });
}

async function uploadBlogImage(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    return apiRequest(`/blogs/upload-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
}

async function detectCategory(title, content, hashtags = '') {
    const token = localStorage.getItem('token');
    return apiRequest('/blogs/detect-category', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, hashtags })
    });
}

async function getFollowersList(userId) {
    const currentUserId = auth.user?.id;
    let url = `/users/${userId}/followers`;
    if (currentUserId) url += `?currentUserId=${currentUserId}`;
    return apiRequest(url);
}

async function getFollowingList(userId) {
    const currentUserId = auth.user?.id;
    let url = `/users/${userId}/following`;
    if (currentUserId) url += `?currentUserId=${currentUserId}`;
    return apiRequest(url);
}

// --- Notification APIs ---

async function getNotifications() {
    const token = localStorage.getItem('token');
    return apiRequest('/notifications', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

async function markNotificationRead(id) {
    const token = localStorage.getItem('token');
    return apiRequest(`/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

async function markAllNotificationsRead() {
    const token = localStorage.getItem('token');
    return apiRequest(`/notifications/read-all`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}
