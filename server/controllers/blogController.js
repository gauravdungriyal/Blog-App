const { supabase, supabaseAdmin } = require('../config/supabase');

exports.getBlogs = async (req, res) => {
    try {
        const { search, category } = req.query;

        // Start building query
        let supabaseQuery = supabase
            .from('blogs')
            .select('*, profiles(name)');

        if (search && search.trim()) {
            const searchTerm = search.trim();
            // Use double quotes for values in or() to handle spaces correctly
            const filter = `title.ilike."%${searchTerm}%",content.ilike."%${searchTerm}%"`;
            console.log('Applying filter:', filter);
            supabaseQuery = supabaseQuery.or(filter);
        }

        if (category) {
            supabaseQuery = supabaseQuery.eq('category', category);
        }

        const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Query Error:', error);
            return res.status(error.code === 'PGRST116' ? 404 : 400).json({ error: error.message });
        }

        res.status(200).json(data || []);
    } catch (err) {
        console.error('SERVER FATAL ERROR [GetBlogs]:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
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
        const { data, error } = await req.supabase
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

exports.getBlogsByAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('blogs')
            .select('*, profiles(name, username, avatar_url)')
            .eq('author_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('GetBlogsByAuthor Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createBlog = async (req, res) => {
    try {
        const { title, content, image_url, category } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const { data, error } = await req.supabase
            .from('blogs')
            .insert([{
                title,
                content,
                image_url: image_url || null,
                category: category || null,
                author_id: req.user.id
            }])
            .select();

        if (error) throw error;

        // Notify followers asynchronously
        req.supabase.from('follows').select('follower_id').eq('following_id', req.user.id)
            .then(({ data: followers }) => {
                if (followers && followers.length > 0) {
                    const newBlogId = data[0].id;
                    const notificationInserts = followers.map(f => ({
                        user_id: f.follower_id,
                        actor_id: req.user.id,
                        type: 'new_post',
                        reference_id: newBlogId
                    }));
                    req.supabase.from('notifications').insert(notificationInserts).then(() => { });
                }
            });

        res.status(201).json(data[0]);
    } catch (err) {
        console.error('CreateBlog Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url, category } = req.body;

        const { data, error } = await req.supabase
            .from('blogs')
            .update({ title, content, image_url: image_url || null, category: category || null })
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

        const { error } = await req.supabase
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

exports.uploadBlogImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user_id = req.user.id;
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${user_id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        console.log(`Uploading blog image to bucket "blog-images", path: ${filePath}`);

        // Upload to blog-images bucket using Admin client
        const { data, error: uploadError } = await (supabaseAdmin || req.supabase).storage
            .from('blog-images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = (supabaseAdmin || req.supabase).storage
            .from('blog-images')
            .getPublicUrl(filePath);

        res.status(200).json({ url: publicUrl });
    } catch (err) {
        console.error('UploadBlogImage Error:', err);
        res.status(500).json({ error: 'Failed to upload blog image' });
    }
};
