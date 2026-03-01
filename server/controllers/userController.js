const { supabase, supabaseAdmin } = require('../config/supabase');

exports.toggleFollow = async (req, res) => {
    try {
        const { id: following_id } = req.params;
        const follower_id = req.user.id;

        if (following_id === follower_id) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }

        // Check if follow exists
        const { data: existingFollow, error: checkError } = await req.supabase
            .from('follows')
            .select('*')
            .eq('follower_id', follower_id)
            .eq('following_id', following_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingFollow) {
            // Unfollow
            const { error: deleteError } = await req.supabase
                .from('follows')
                .delete()
                .eq('id', existingFollow.id);
            if (deleteError) throw deleteError;
            return res.status(200).json({ message: 'Unfollowed successfully', isFollowing: false });
        } else {
            // Follow
            const { error: insertError } = await req.supabase
                .from('follows')
                .insert([{ follower_id, following_id }]);
            if (insertError) throw insertError;
            return res.status(201).json({ message: 'Followed successfully', isFollowing: true });
        }
    } catch (err) {
        console.error('ToggleFollow Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getFollowStatus = async (req, res) => {
    try {
        const { id: following_id } = req.params;
        const follower_id = req.query.userId || null;

        if (!follower_id) {
            return res.status(200).json({ isFollowing: false });
        }

        const { data: existingFollow, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', follower_id)
            .eq('following_id', following_id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.status(200).json({ isFollowing: !!existingFollow });
    } catch (err) {
        console.error('GetFollowStatus Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [followersResult, followingResult] = await Promise.all([
            // Count followers
            req.supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', user_id),

            // Count following
            req.supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', user_id)
        ]);

        if (followersResult.error) throw followersResult.error;
        if (followingResult.error) throw followingResult.error;

        res.status(200).json({
            followers: followersResult.count || 0,
            following: followingResult.count || 0
        });
    } catch (err) {
        console.error('GetDashboardStats Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { name, avatar_url, username } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (username) {
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                return res.status(400).json({ error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.' });
            }
        }

        const { data, error } = await req.supabase
            .from('profiles')
            .update({ name, avatar_url, username })
            .eq('id', user_id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'Username is already taken' });
            }
            throw error;
        }

        res.status(200).json({ message: 'Profile updated successfully', profile: data });
    } catch (err) {
        console.error('UpdateProfile Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user_id = req.user.id;
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${user_id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        console.log(`Uploading avatar to bucket "avatars", path: ${filePath}`);

        // Upload to Supabase Storage using Admin client to bypass RLS issues
        // and ensure bucket/policy permissions don't block backend-authenticated users
        const { data, error: uploadError } = await (supabaseAdmin || req.supabase).storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL using Admin client
        const { data: { publicUrl } } = (supabaseAdmin || req.supabase).storage
            .from('avatars')
            .getPublicUrl(filePath);

        res.status(200).json({ url: publicUrl });
    } catch (err) {
        console.error('UploadAvatar Error:', err);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: follows, error: followsError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', id);

        if (followsError) throw followsError;

        const followerIds = follows.map(f => f.follower_id);

        if (followerIds.length === 0) {
            return res.status(200).json([]);
        }

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', followerIds);

        if (profilesError) throw profilesError;

        const currentUserId = req.query.currentUserId;
        let profilesWithStatus = profiles;

        if (currentUserId && followerIds.length > 0) {
            const { data: myFollows, error: myFollowsError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUserId)
                .in('following_id', followerIds);

            if (!myFollowsError && myFollows) {
                const followingSet = new Set(myFollows.map(f => f.following_id));
                profilesWithStatus = profiles.map(p => ({
                    ...p,
                    is_following: followingSet.has(p.id)
                }));
            }
        }

        res.status(200).json(profilesWithStatus);
    } catch (err) {
        console.error('GetFollowers Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: follows, error: followsError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', id);

        if (followsError) throw followsError;

        const followingIds = follows.map(f => f.following_id);

        if (followingIds.length === 0) {
            return res.status(200).json([]);
        }

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, username')
            .in('id', followingIds);

        if (profilesError) throw profilesError;

        const currentUserId = req.query.currentUserId;
        let profilesWithStatus = profiles;

        if (currentUserId && followingIds.length > 0) {
            const { data: myFollows, error: myFollowsError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUserId)
                .in('following_id', followingIds);

            if (!myFollowsError && myFollows) {
                const followingSet = new Set(myFollows.map(f => f.following_id));
                profilesWithStatus = profiles.map(p => ({
                    ...p,
                    is_following: followingSet.has(p.id)
                }));
            }
        }

        res.status(200).json(profilesWithStatus);
    } catch (err) {
        console.error('GetFollowing Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query, currentUserId } = req.query;
        if (!query) return res.status(200).json([]);

        let queryBuilder = supabase
            .from('profiles')
            .select('id, name, avatar_url, username')
            .or(`username.ilike.%${query}%,name.ilike.%${query}%`);

        if (currentUserId) {
            queryBuilder = queryBuilder.neq('id', currentUserId);
        }

        const { data: profiles, error } = await queryBuilder.limit(10);

        if (error) throw error;

        let profilesWithStatus = profiles;
        if (currentUserId && profiles.length > 0) {
            const userIds = profiles.map(p => p.id);
            const { data: follows, error: followsError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUserId)
                .in('following_id', userIds);

            if (!followsError && follows) {
                const followingSet = new Set(follows.map(f => f.following_id));
                profilesWithStatus = profiles.map(p => ({
                    ...p,
                    is_following: followingSet.has(p.id)
                }));
            }
        }

        res.status(200).json(profilesWithStatus);
    } catch (err) {
        console.error('SearchUsers Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, username')
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
            throw error;
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('GetUserByUsername Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
