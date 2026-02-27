const { supabase } = require('../config/supabase');

exports.getBlogs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select('*, profiles(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('GetBlogs Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('blogs')
            .select('*, profiles(name)')
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ error: 'Blog not found' });
        res.status(200).json(data);
    } catch (err) {
        console.error('GetBlogById Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getMyBlogs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('author_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('GetMyBlogs Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createBlog = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                title,
                content,
                author_id: req.user.id
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error('CreateBlog Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const { data, error } = await supabase
            .from('blogs')
            .update({ title, content })
            .eq('id', id)
            .eq('author_id', req.user.id) // Ensure ownership
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Blog not found or unauthorized' });

        res.status(200).json(data[0]);
    } catch (err) {
        console.error('UpdateBlog Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id)
            .eq('author_id', req.user.id); // Ensure ownership

        if (error) throw error;
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (err) {
        console.error('DeleteBlog Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
