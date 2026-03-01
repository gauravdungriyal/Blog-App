const { supabase } = require('../config/supabase');

exports.getNotifications = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Fetch notifications joined with actor profiles
        const { data, error } = await req.supabase
            .from('notifications')
            .select(`
                *,
                actor:actor_id (id, name, avatar_url)
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        console.error('getNotifications Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { id } = req.params;

        const { error } = await req.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) throw error;

        res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
        console.error('markAsRead Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const user_id = req.user.id;

        const { error } = await req.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user_id)
            .eq('is_read', false);

        if (error) throw error;

        res.status(200).json({ message: 'All marked as read' });
    } catch (err) {
        console.error('markAllRead Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
