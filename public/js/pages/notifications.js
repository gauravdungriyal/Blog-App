async function renderNotifications() {
    const app = document.getElementById('app');
    app.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);">Loading notifications...</div>';

    if (!auth.isAuthenticated()) {
        router.navigate('/');
        return;
    }

    try {
        const notifications = await getNotifications();

        let html = `
            <div style="max-width: 800px; margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2rem;">Notifications</h1>
                    <button class="btn btn-outline" onclick="window.handleMarkAllRead()">Mark all as read</button>
                </div>
                <div id="notifications-list" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
        `;

        if (notifications.length === 0) {
            html += `<div style="padding: 3rem; text-align: center; color: var(--text-muted);">You don't have any notifications yet.</div>`;
        } else {
            for (const notif of notifications) {
                const isReadStyle = notif.is_read ? 'opacity: 0.7;' : 'background: rgba(var(--primary-rgb), 0.05); border-left: 4px solid var(--primary);';

                let icon = '';
                let text = '';

                if (notif.type === 'like') {
                    icon = '❤️';
                    text = `<strong>${notif.actor?.name || 'Someone'}</strong> liked your post`;
                } else if (notif.type === 'comment') {
                    icon = '💬';
                    text = `<strong>${notif.actor?.name || 'Someone'}</strong> commented on your post`;
                } else if (notif.type === 'new_post') {
                    icon = '📝';
                    text = `<strong>${notif.actor?.name || 'Someone'}</strong> published a new story`;
                }

                // Format timestamp
                const date = new Date(notif.created_at);
                const timeStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                // Construct fallback avatar
                const initial = (notif.actor?.name || 'U').charAt(0).toUpperCase();
                const avatar = notif.actor?.avatar_url
                    ? `<img src="${notif.actor.avatar_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect fill=\\'%23e2e8f0\\' width=\\'40\\' height=\\'40\\'/><text fill=\\'%2364748b\\' font-family=\\'sans-serif\\' font-size=\\'16\\' font-weight=\\'bold\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>${initial}</text></svg>';">`
                    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`;

                html += `
                    <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; ${isReadStyle}" 
                         onclick="window.handleNotificationClick('${notif.id}', '${notif.reference_id}', '${notif.type}')" 
                         onmouseover="this.style.background='var(--background)'" 
                         onmouseout="this.style.background='${notif.is_read ? 'transparent' : 'rgba(var(--primary-rgb), 0.05)'}'">
                        ${avatar}
                        <div style="flex: 1;">
                            <div style="margin-bottom: 0.25rem;">
                                <span style="margin-right: 0.5rem; font-size: 1.1rem;">${icon}</span>
                                ${text}
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.85rem;">${timeStr}</div>
                        </div>
                        ${!notif.is_read ? `<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary);"></div>` : ''}
                    </div>
                `;
            }
        }

        html += `
                </div>
            </div>
        `;
        app.innerHTML = html;

        // Automatically mark all notifications as read when the page is visited
        const hasUnread = notifications.some(n => !n.is_read);
        if (hasUnread) {
            markAllNotificationsRead().then(() => {
                auth.updateNav();
            }).catch(console.error);
        }

    } catch (err) {
        app.innerHTML = `<div style="padding: 2rem; color: var(--error); text-align: center;">Failed to load notifications: ${err.message}</div>`;
    }
}

// Global handlers for clicks
window.handleNotificationClick = async (notifId, referenceId, type) => {
    try {
        await markNotificationRead(notifId);
        // Navigate based on type
        if (type === 'new_post' || type === 'like' || type === 'comment') {
            if (referenceId) {
                router.navigate(`/blog/${referenceId}`);
            } else {
                router.navigate('/dashboard'); // Fallback
            }
        }
    } catch (error) {
        console.error("Failed to mark notification state", error);
    }
};

window.handleMarkAllRead = async () => {
    try {
        await markAllNotificationsRead();
        await renderNotifications(); // Refresh page
        auth.updateNav(); // Refresh sidebar badge
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        showToast('Failed to mark all as read', 'error');
    }
};

window.renderNotifications = renderNotifications;
