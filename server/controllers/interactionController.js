const { supabase } = require('../config/supabase');

// --- Likes ---

exports.toggleLike = async (req, res) => {
    try {
        const { id: blog_id } = req.params;
        const user_id = req.user.id;

        // Check if like exists
        const { data: existingLike, error: checkError } = await req.supabase
            .from('likes')
            .select('*')
            .eq('blog_id', blog_id)
            .eq('user_id', user_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found'
            throw checkError;
        }

        if (existingLike) {
            // Remove like
            const { error: deleteError } = await req.supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id);
            if (deleteError) throw deleteError;
            return res.status(200).json({ message: 'Like removed', liked: false });
        } else {
            // Add like
            try {
                const { error: insertError } = await req.supabase
                    .from('likes')
                    .insert([{ blog_id, user_id }]);
                if (insertError) throw insertError;

                // Fire notification logic asynchronously
                req.supabase.from('blogs').select('author_id').eq('id', blog_id).single()
                    .then(({ data: blogData }) => {
                        if (blogData && blogData.author_id !== user_id) {
                            req.supabase.from('notifications').insert([{
                                user_id: blogData.author_id,
                                actor_id: user_id,
                                type: 'like',
                                reference_id: blog_id
                            }]).then(() => { }); // fire and forget
                        }
                    });

                return res.status(201).json({ message: 'Like added', liked: true });
            } catch (insertErr) {
                if (insertErr.code === '23505') {
                    // Unique constraint violation - already liked, just treat as success
                    return res.status(201).json({ message: 'Already liked', liked: true });
                }
                throw insertErr;
            }
        }
    } catch (err) {
        console.error('ToggleLike Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getLikes = async (req, res) => {
    try {
        const { id: blog_id } = req.params;
        const user_id = req.query.userId || null; // Optional to check if specific user liked

        const { count, error: countError } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('blog_id', blog_id);

        if (countError) throw countError;

        let userLiked = false;
        if (user_id) {
            const { data: existingLike } = await supabase
                .from('likes')
                .select('*')
                .eq('blog_id', blog_id)
                .eq('user_id', user_id)
                .single();
            if (existingLike) userLiked = true;
        }

        res.status(200).json({ count: count || 0, userLiked });
    } catch (err) {
        console.error('GetLikes Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Comments ---

exports.addComment = async (req, res) => {
    try {
        const { id: blog_id } = req.params;
        const user_id = req.user.id;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const { data, error } = await req.supabase
            .from('comments')
            .insert([{ blog_id, user_id, content }])
            .select('*, profiles(name)')
            .single();

        if (error) throw error;

        // Fire notification logic asynchronously
        req.supabase.from('blogs').select('author_id').eq('id', blog_id).single()
            .then(({ data: blogData }) => {
                if (blogData && blogData.author_id !== user_id) {
                    req.supabase.from('notifications').insert([{
                        user_id: blogData.author_id,
                        actor_id: user_id,
                        type: 'comment',
                        reference_id: data.id // The new comment ID
                    }]).then(() => { }); // fire and forget
                }
            });
        res.status(201).json(data);
    } catch (err) {
        console.error('AddComment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { id: blog_id } = req.params;

        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles(name)')
            .eq('blog_id', blog_id)
            .order('created_at', { ascending: true }); // Oldest first

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('GetComments Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id: blog_id, commentId } = req.params;
        const user_id = req.user.id; // User doing the deleting

        const { error } = await req.supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('blog_id', blog_id)
            .eq('user_id', user_id); // Ensures user can only delete their own comment

        if (error) throw error;
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('DeleteComment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
